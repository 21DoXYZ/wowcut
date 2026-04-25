import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { generateVideoScript } from "@wowcut/ai";
import { generateAllSceneVisuals } from "@wowcut/ai";
import { Queue } from "bullmq";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const sceneQueue = new Queue("aicon-scene", { connection: redis });

const DurationEnum = z.enum(["s15", "s30", "s60"]);

export const videoProjectRouter = router({
  // Create a new video project and immediately generate script + storyboard
  create: publicProcedure
    .input(z.object({
      topic: z.string().min(3).max(200),
      duration: DurationEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Generate script
      const script = await generateVideoScript(input.topic, input.duration);

      // 2. Generate storyboard visuals for all scenes in parallel
      const visuals = await generateAllSceneVisuals(input.topic, script.scenes);

      // 3. Create project + scenes in DB
      const project = await ctx.prisma.videoProject.create({
        data: {
          topic: input.topic,
          duration: input.duration,
          status: "generating",
          script: script as unknown as object,
          scenes: {
            create: script.scenes.map((scene, i) => ({
              index: scene.index,
              title: scene.title,
              action: scene.action,
              voiceover: scene.voiceover,
              durationS: scene.durationS,
              shotType: visuals[i]?.shotType,
              visualDescription: visuals[i]?.visualDescription,
              imagePrompt: visuals[i]?.imagePrompt,
              negativePrompt: visuals[i]?.negativePrompt,
              imageStatus: "pending",
            })),
          },
        },
        include: { scenes: { orderBy: { index: "asc" } } },
      });

      // 4. Queue image generation for all scenes
      for (const scene of project.scenes) {
        await sceneQueue.add(
          `scene-${scene.id}`,
          { sceneId: scene.id },
          { priority: 1, attempts: 2 },
        );
      }

      return project;
    }),

  // List all projects
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

  // Get single project with all scenes
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.videoProject.findUnique({
        where: { id: input.id },
        include: { scenes: { orderBy: { index: "asc" } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  // Approve or reject a scene with optional feedback
  reviewScene: publicProcedure
    .input(z.object({
      sceneId: z.string(),
      approved: z.boolean(),
      feedback: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const scene = await ctx.prisma.videoScene.update({
        where: { id: input.sceneId },
        data: {
          approved: input.approved,
          feedback: input.feedback,
        },
        include: { project: true },
      });

      // If rejected with feedback → re-queue image generation
      if (!input.approved && input.feedback) {
        // Regenerate prompt with feedback incorporated
        // For now: re-queue with the existing prompt (user can iterate)
        await ctx.prisma.videoScene.update({
          where: { id: input.sceneId },
          data: { imageStatus: "pending", imageUrl: null },
        });
        await sceneQueue.add(
          `scene-retry-${scene.id}-${Date.now()}`,
          { sceneId: scene.id },
          { priority: 1, attempts: 2 },
        );
      }

      return scene;
    }),

  // Start animation for all approved scenes
  startAnimation: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const animateQueue = new Queue("aicon-animate", { connection: redis });

      const approvedScenes = await ctx.prisma.videoScene.findMany({
        where: { projectId: input.projectId, approved: true, imageStatus: "done" },
        orderBy: { index: "asc" },
      });

      if (approvedScenes.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No approved scenes to animate" });
      }

      await ctx.prisma.videoProject.update({
        where: { id: input.projectId },
        data: { status: "animating" },
      });

      for (const scene of approvedScenes) {
        await animateQueue.add(
          `animate-${scene.id}`,
          { sceneId: scene.id },
          { priority: 1, attempts: 2 },
        );
      }

      return { queued: approvedScenes.length };
    }),

  // Delete project
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.videoProject.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
