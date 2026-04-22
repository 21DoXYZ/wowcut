"use client";
import { Card, MonoLabel, Badge, Button } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function TrendsPage() {
  const drops = trpc.trends.list.useQuery();
  const publish = trpc.trends.publish.useMutation({ onSuccess: () => drops.refetch() });

  return (
    <section className="p-10 max-w-[1200px]">
      <MonoLabel>Trend drops</MonoLabel>
      <h1 className="mt-3 brand-heading">Monthly themes</h1>

      <div className="mt-8 space-y-3">
        {drops.data?.map((d) => (
          <Card key={d.id} className="p-6 flex items-center justify-between">
            <div>
              <MonoLabel size="sm" className="text-ink/60">{d.monthKey}</MonoLabel>
              <div className="mt-1 fw-540 text-[22px] tracking-[-0.4px]">{d.theme}</div>
              <p className="mt-1 text-body fw-330 text-ink/70 max-w-xl">{d.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={d.publishedAt ? "ok" : "neutral"}>
                {d.publishedAt ? "published" : "draft"}
              </Badge>
              <Badge tone="neutral">{d.assignments.length} assigned</Badge>
              {!d.publishedAt && (
                <Button variant="black" onClick={() => publish.mutate({ monthKey: d.monthKey })}>
                  Publish
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
