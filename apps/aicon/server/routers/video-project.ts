import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import {
  detectPlatform,
  regenerateSceneVisualWithFeedback,
  type SceneScript,
} from "@wowcut/ai";
import {
  enqueueAiconBootstrap,
  enqueueAiconScene,
  enqueueAiconAnimate,
  checkRateLimit,
} from "@wowcut/queues";
import { deletePrefix } from "@wowcut/storage";

const DurationEnum = z.enum(["s15", "s30", "s60"]);

// Accept tiktok.com/... without protocol — auto-prefix in pre-validation.
const ReferenceUrlSchema = z
  .string()
  .trim()
  .min(1)
  .transform((s) => (s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`))
  .pipe(z.string().url())
  .refine(
    (u) => {
      try { detectPlatform(u); return true; } catch { return false; }
    },
    { message: "Reference URL must be Instagram, TikTok or YouTube" },
  );

export const videoProjectRouter = router({
  // Create a draft project. Heavy work (scrape, analyse, script, storyboard)
  // runs asynchronously in aicon-bootstrap worker so the HTTP request returns
  // immediately and the UI can poll for progress.
  create: publicProcedure
    .input(z.object({
      topic: z.string().min(3).max(200),
      duration: DurationEnum,
      referenceUrl: ReferenceUrlSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Project-creation rate limit (covers Apify spend even when no auth yet).
      const rl = await checkRateLimit({
        bucket: "aicon-create",
        key: ctx.ipHash,
        limit: input.referenceUrl ? 10 : 30, // tighter when Apify is invoked
        windowSec: 60 * 60,                   // 1h window
      });
      if (!rl.ok) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: rl.message! });
      }

      const project = await ctx.prisma.videoProject.create({
        data: {
          topic: input.topic,
          duration: input.duration,
          status: "draft",
          referenceUrl: input.referenceUrl,
          costUsd: 0, // start at 0 so workers can `increment` cleanly
        },
      });
      await enqueueAiconBootstrap(project.id);
      return project;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.videoProject.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        scenes: {
          select: {
            id: true, index: true, imageStatus: true, videoStatus: true, approved: true,
          },
          orderBy: { index: "asc" },
        },
      },
    });
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.videoProject.findUnique({
        where: { id: input.id },
        include: { scenes: { orderBy: { index: "asc" } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      // Surface reference processing state to the UI.
      const referenceFailed =
        !!project.referenceUrl && project.status !== "draft" && !project.referenceAnalysis;
      return { ...project, referenceFailed };
    }),

  // Approve / reject a scene. If rejected with feedback we rewrite the prompt
  // through Gemini and re-queue keyframe generation so the user actually gets
  // a different image (not the same prompt with a fresh seed).
  reviewScene: publicProcedure
    .input(z.object({
      sceneId: z.string(),
      approved: z.boolean(),
      feedback: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const scene = await ctx.prisma.videoScene.findUnique({
        where: { id: input.sceneId },
        include: { project: true },
      });
      if (!scene) throw new TRPCError({ code: "NOT_FOUND" });

      // Approval (or simple un-approve) — flip flag and stop.
      if (input.approved || !input.feedback) {
        return ctx.prisma.videoScene.update({
          where: { id: input.sceneId },
          data: { approved: input.approved, feedback: input.feedback },
        });
      }

      // Rejected with feedback: rewrite prompt, re-queue.
      const script = scene.project.script as { scenes: SceneScript[] } | null;
      const sceneScript = script?.scenes.find((s) => s.index === scene.index);
      if (!sceneScript) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Scene script missing on project — cannot regenerate.",
        });
      }

      const rewritten = await regenerateSceneVisualWithFeedback({
        topic: scene.project.topic,
        scene: sceneScript,
        totalScenes: script!.scenes.length,
        previousPrompt: scene.imagePrompt ?? "",
        feedback: input.feedback,
      });

      await ctx.prisma.videoScene.update({
        where: { id: input.sceneId },
        data: {
          approved: false,
          feedback: input.feedback,
          shotType: rewritten.shotType,
          visualDescription: rewritten.visualDescription,
          imagePrompt: rewritten.imagePrompt,
          negativePrompt: rewritten.negativePrompt,
          imageStatus: "pending",
          imageUrl: null,
        },
      });
      await enqueueAiconScene(scene.id);

      return { ok: true, regenerated: true };
    }),

  // Manually retry a failed image without feedback (uses existing prompt).
  retryScene: publicProcedure
    .input(z.object({ sceneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.videoScene.update({
        where: { id: input.sceneId },
        data: { imageStatus: "pending", imageUrl: null },
      });
      await enqueueAiconScene(input.sceneId);
      return { ok: true };
    }),

  // Start animation for approved scenes that don't already have a video.
  startAnimation: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const approvedScenes = await ctx.prisma.videoScene.findMany({
        where: {
          projectId: input.projectId,
          approved: true,
          imageStatus: "done",
          videoStatus: { not: "done" },
        },
        orderBy: { index: "asc" },
      });

      if (approvedScenes.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No approved scenes left to animate",
        });
      }

      await ctx.prisma.videoProject.update({
        where: { id: input.projectId },
        data: { status: "animating" },
      });

      for (const scene of approvedScenes) {
        await enqueueAiconAnimate(scene.id);
      }

      return { queued: approvedScenes.length };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Best-effort R2 cleanup BEFORE the DB row goes away — if R2 fails we
      // still want the user's row gone, so swallow errors here.
      await deletePrefix(`aicon/${input.id}/`).catch((err) => {
        console.error(`[aicon.delete] R2 cleanup failed for ${input.id}:`, err);
      });
      await ctx.prisma.videoProject.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
