import { runActorSync } from "./apify-client";

export type ReferencePlatform = "instagram" | "tiktok" | "youtube";

export interface ScrapedReference {
  platform: ReferencePlatform;
  url: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  author: string | null;
  durationSec: number | null;
  viewCount: number | null;
  likeCount: number | null;
  raw: Record<string, unknown>;
}

export function detectPlatform(url: string): ReferencePlatform {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  throw new Error(`Unsupported reference URL: ${url}`);
}

interface InstagramItem {
  videoUrl?: string;
  displayUrl?: string;
  caption?: string;
  ownerUsername?: string;
  videoDuration?: number;
  videoViewCount?: number;
  likesCount?: number;
}

interface TikTokItem {
  videoMeta?: { downloadAddr?: string; coverUrl?: string; duration?: number };
  text?: string;
  authorMeta?: { name?: string };
  playCount?: number;
  diggCount?: number;
  webVideoUrl?: string;
}

interface YouTubeItem {
  url?: string;
  title?: string;
  text?: string;
  channelName?: string;
  duration?: string;
  viewCount?: number;
  likes?: number;
  thumbnailUrl?: string;
  // youtube-scraper does not return a direct mp4 — we'll need yt-dlp for that.
  // For now we keep videoUrl null and rely on metadata + thumbnail for analysis.
}

export async function scrapeReference(url: string): Promise<ScrapedReference> {
  const platform = detectPlatform(url);

  if (platform === "instagram") {
    const items = await runActorSync<InstagramItem>({
      actor: "apify/instagram-scraper",
      input: { directUrls: [url], resultsType: "posts", resultsLimit: 1 },
    });
    const it = items[0];
    if (!it) throw new Error(`Instagram scrape returned no items for ${url}`);
    return {
      platform,
      url,
      videoUrl: it.videoUrl ?? null,
      thumbnailUrl: it.displayUrl ?? null,
      caption: it.caption ?? null,
      author: it.ownerUsername ?? null,
      durationSec: it.videoDuration ?? null,
      viewCount: it.videoViewCount ?? null,
      likeCount: it.likesCount ?? null,
      raw: it as unknown as Record<string, unknown>,
    };
  }

  if (platform === "tiktok") {
    const items = await runActorSync<TikTokItem>({
      actor: "clockworks/free-tiktok-scraper",
      input: { postURLs: [url], resultsPerPage: 1, shouldDownloadVideos: false },
    });
    const it = items[0];
    if (!it) throw new Error(`TikTok scrape returned no items for ${url}`);
    return {
      platform,
      url,
      videoUrl: it.videoMeta?.downloadAddr ?? it.webVideoUrl ?? null,
      thumbnailUrl: it.videoMeta?.coverUrl ?? null,
      caption: it.text ?? null,
      author: it.authorMeta?.name ?? null,
      durationSec: it.videoMeta?.duration ?? null,
      viewCount: it.playCount ?? null,
      likeCount: it.diggCount ?? null,
      raw: it as unknown as Record<string, unknown>,
    };
  }

  // YouTube
  const items = await runActorSync<YouTubeItem>({
    actor: "streamers/youtube-scraper",
    input: { startUrls: [{ url }], maxResults: 1, downloadSubtitles: false },
  });
  const it = items[0];
  if (!it) throw new Error(`YouTube scrape returned no items for ${url}`);
  return {
    platform,
    url,
    videoUrl: null, // youtube-scraper doesn't return mp4 directly
    thumbnailUrl: it.thumbnailUrl ?? null,
    caption: it.title ?? it.text ?? null,
    author: it.channelName ?? null,
    durationSec: parseDurationToSec(it.duration),
    viewCount: it.viewCount ?? null,
    likeCount: it.likes ?? null,
    raw: it as unknown as Record<string, unknown>,
  };
}

function parseDurationToSec(d: string | undefined): number | null {
  if (!d) return null;
  // formats: "1:23" or "1:02:03"
  const parts = d.split(":").map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}
