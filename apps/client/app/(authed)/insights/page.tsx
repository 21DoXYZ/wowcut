"use client";
import { useState } from "react";
import { Button, Card, Input, Label, MonoLabel } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function InsightsPage() {
  const list = trpc.insights.list.useQuery();
  const summary = trpc.insights.summary.useQuery();
  const create = trpc.insights.create.useMutation({
    onSuccess: () => {
      list.refetch();
      summary.refetch();
      setChannel("instagram");
      setLikes("");
      setSaves("");
      setComments("");
    },
  });

  const [channel, setChannel] = useState("instagram");
  const [likes, setLikes] = useState("");
  const [saves, setSaves] = useState("");
  const [comments, setComments] = useState("");

  return (
    <section className="p-12 max-w-[1200px]">
      <MonoLabel>Insights</MonoLabel>
      <h1 className="mt-3 brand-subheading">What&rsquo;s working</h1>

      {summary.data && (
        <Card className="mt-8 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Metric label="Entries" value={summary.data.entries} />
          <Metric label="Total likes" value={summary.data.totals.likes} />
          <Metric label="Total saves" value={summary.data.totals.saves} />
          <Metric label="Total comments" value={summary.data.totals.comments} />
        </Card>
      )}

      <Card className="mt-8 p-6">
        <h2 className="brand-subheading">Log a post</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Channel</Label>
            <select
              className="w-full px-4 py-3 rounded-lg bg-paper border border-ink/15 text-[16px] fw-340"
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
            <Input type="number" value={likes} onChange={(e) => setLikes(e.target.value)} />
          </div>
          <div>
            <Label>Saves</Label>
            <Input type="number" value={saves} onChange={(e) => setSaves(e.target.value)} />
          </div>
          <div>
            <Label>Comments</Label>
            <Input type="number" value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-6"
          variant="black"
          onClick={() =>
            create.mutate({
              channel,
              likes: likes ? Number(likes) : undefined,
              saves: saves ? Number(saves) : undefined,
              comments: comments ? Number(comments) : undefined,
            })
          }
        >
          Save entry
        </Button>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <MonoLabel size="sm" className="text-ink/60">{label}</MonoLabel>
      <div className="mt-1 text-[40px] leading-none font-[540] tracking-[-0.64px]">{value}</div>
    </div>
  );
}
