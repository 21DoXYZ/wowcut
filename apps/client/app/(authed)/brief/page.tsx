"use client";
import { useState } from "react";
import { Button, Card, MonoLabel, Textarea } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function BriefPage() {
  const submit = trpc.brief.submitUpdate.useMutation();
  const recent = trpc.brief.recent.useQuery();
  const [promos, setPromos] = useState("");
  const [styleChange, setStyleChange] = useState("");

  return (
    <section className="p-12 max-w-[720px]">
      <MonoLabel>Brief update</MonoLabel>
      <h1 className="mt-3 brand-subheading">Keep us in the loop</h1>
      <p className="mt-2 text-body fw-330 text-ink/70">3 quick questions. Takes under a minute.</p>

      <Card className="mt-8 p-6 space-y-6">
        <div>
          <label className="text-[14px] fw-480 tracking-tight-sm">Promos / launches coming up?</label>
          <Textarea
            value={promos}
            onChange={(e) => setPromos(e.target.value)}
            placeholder="Black Friday 30% off, new lipstick launching Oct 15, etc."
          />
        </div>
        <div>
          <label className="text-[14px] fw-480 tracking-tight-sm">Want to change styles?</label>
          <Textarea
            value={styleChange}
            onChange={(e) => setStyleChange(e.target.value)}
            placeholder="More CGI, less editorial, etc."
          />
        </div>
        <Button
          variant="black"
          onClick={() =>
            submit.mutate({
              promos: promos || undefined,
              styleChange: styleChange || undefined,
            })
          }
          disabled={submit.isPending}
        >
          Submit update
        </Button>
      </Card>

      {recent.data?.length ? (
        <div className="mt-10">
          <MonoLabel size="sm">Recent updates</MonoLabel>
          <ul className="mt-4 space-y-2 text-[13px] fw-330 text-ink/70">
            {recent.data.map((u) => (
              <li key={u.id}>
                {u.createdAt.toString()} — {JSON.stringify(u.changes)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
