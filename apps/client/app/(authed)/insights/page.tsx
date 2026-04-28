"use client";
import { useState } from "react";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

const CHANNEL_TAG: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  pinterest: "PN",
  website: "WB",
};

function BarChart({
  data,
  metric,
}: {
  data: { channel: string; likes: number; saves: number; comments: number; shares: number }[];
  metric: "likes" | "saves" | "comments" | "shares";
}) {
  const max = Math.max(...data.map((d) => d[metric]), 1);
  return (
    <div className="space-y-4">
      {data.map((row) => {
        const val = row[metric];
        const pct = (val / max) * 100;
        return (
          <div key={row.channel}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] fw-480 capitalize">{row.channel}</span>
              <span className="text-[13px] fw-540 tabular-nums">{val.toLocaleString()}</span>
            </div>
            <div className="h-[6px] rounded-full bg-ink/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-ink transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsPage() {
  const list = trpc.insights.list.useQuery();
  const summary = trpc.insights.summary.useQuery();
  const byChannel = trpc.insights.byChannel.useQuery();

  const create = trpc.insights.create.useMutation({
    onSuccess: () => {
      list.refetch();
      summary.refetch();
      byChannel.refetch();
      setChannel("instagram");
      setLikes("");
      setSaves("");
      setComments("");
      setViews("");
    },
  });
  const remove = trpc.insights.remove.useMutation({
    onSuccess: () => {
      list.refetch();
      summary.refetch();
      byChannel.refetch();
    },
  });

  const [activeMetric, setActiveMetric] = useState<"likes" | "saves" | "comments" | "shares">("likes");
  const [channel, setChannel] = useState("instagram");
  const [likes, setLikes] = useState("");
  const [saves, setSaves] = useState("");
  const [comments, setComments] = useState("");
  const [views, setViews] = useState("");

  const channels = byChannel.data ?? [];

  return (
    <section className="p-12 max-w-[1100px]">
      <MonoLabel>Insights</MonoLabel>
      <h1 className="mt-3 brand-subheading">What&apos;s working</h1>

      {summary.data && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Posts logged", value: summary.data.entries },
            { label: "Total likes", value: summary.data.totals.likes },
            { label: "Total saves", value: summary.data.totals.saves },
            { label: "Total comments", value: summary.data.totals.comments },
          ].map(({ label, value }) => (
            <Card key={label} className="p-5">
              <div className="text-[32px] fw-540 tracking-[-0.5px] leading-none">
                {value.toLocaleString()}
              </div>
              <div className="mt-2 text-[12px] fw-330 text-ink/50">{label}</div>
            </Card>
          ))}
        </div>
      )}

      {channels.length > 0 && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="brand-subheading">By channel</h2>
            <div className="flex gap-1 bg-ink/5 p-1 rounded-[8px]">
              {(["likes", "saves", "comments", "shares"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 rounded-[6px] text-[12px] fw-430 capitalize transition-colors ${
                    activeMetric === m
                      ? "bg-paper text-ink shadow-sm"
                      : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={channels} metric={activeMetric} />
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="brand-subheading mb-4">Log a post</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <Label>Channel</Label>
            <select
              className="w-full px-4 py-3 rounded-lg bg-paper border border-ink/15 text-[14px] fw-340"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="pinterest">Pinterest</option>
              <option value="website">Website</option>
            </select>
          </div>
          <div>
            <Label>Likes</Label>
            <Input type="number" value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Saves</Label>
            <Input type="number" value={saves} onChange={(e) => setSaves(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Comments</Label>
            <Input type="number" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Views</Label>
            <Input type="number" value={views} onChange={(e) => setViews(e.target.value)} placeholder="0" />
          </div>
        </div>
        <Button
          className="mt-4"
          variant="black"
          loading={create.isPending}
          onClick={() =>
            create.mutate({
              channel,
              likes: likes ? Number(likes) : undefined,
              saves: saves ? Number(saves) : undefined,
              comments: comments ? Number(comments) : undefined,
              views: views ? Number(views) : undefined,
            })
          }
        >
          Save entry
        </Button>
      </Card>

      {list.data && list.data.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="brand-subheading mb-4">Recent entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead className="border-b border-ink/10 text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/40">
                <tr>
                  <th className="pb-2">Channel</th>
                  <th className="pb-2">Likes</th>
                  <th className="pb-2">Saves</th>
                  <th className="pb-2">Comments</th>
                  <th className="pb-2">Views</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {list.data.slice(0, 25).map((e) => (
                  <tr key={e.id} className="border-b border-ink/5 text-[14px] fw-340">
                    <td className="py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[10px] fw-540 bg-ink/8 rounded px-1.5 py-0.5 font-mono">
                          {CHANNEL_TAG[e.channel] ?? e.channel.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="capitalize">{e.channel}</span>
                      </span>
                    </td>
                    <td className="py-2 tabular-nums">{(e.likes ?? 0).toLocaleString()}</td>
                    <td className="py-2 tabular-nums">{(e.saves ?? 0).toLocaleString()}</td>
                    <td className="py-2 tabular-nums">{(e.comments ?? 0).toLocaleString()}</td>
                    <td className="py-2 tabular-nums">{(e.views ?? 0).toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => remove.mutate({ id: e.id })}
                        disabled={remove.isPending}
                        className="text-[12px] fw-330 text-ink/30 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!list.isLoading && !list.data?.length && (
        <div className="mt-8 text-center py-12 border border-dashed border-ink/12 rounded-[14px]">
          <p className="text-[14px] fw-330 text-ink/40">
            No posts logged yet. Log your first post above to start tracking performance.
          </p>
        </div>
      )}
    </section>
  );
}
