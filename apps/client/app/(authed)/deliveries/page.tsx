"use client";
import Image from "next/image";
import { Button, Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function DeliveriesPage() {
  const weeks = trpc.delivery.listWeeks.useQuery();
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const week = trpc.delivery.byWeek.useQuery(
    { weekKey: weekKey ?? "" },
    { enabled: !!weekKey },
  );
  const rate = trpc.delivery.rateWeek.useMutation();

  const activeWeek = weekKey ?? weeks.data?.[0]?.weekKey ?? null;
  const activeData = weekKey ? week.data : null;

  return (
    <section className="p-12 max-w-[1200px]">
      <MonoLabel>Deliveries</MonoLabel>
      <h1 className="mt-3 brand-subheading">Your weekly content</h1>

      <div className="mt-8 flex gap-2 flex-wrap">
        {weeks.data?.map((w) => (
          <button
            key={w.id}
            onClick={() => setWeekKey(w.weekKey)}
            data-active={activeWeek === w.weekKey}
            className="brand-pill-tab bg-ink/5 data-[active=true]:bg-ink data-[active=true]:text-paper"
          >
            {w.weekKey}
          </button>
        ))}
      </div>

      {activeData && (
        <div className="mt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {activeData.items.map((unit) => (
              <Card key={unit.id} className="p-0 overflow-hidden">
                <div className="aspect-[4/5] bg-ink/5 relative">
                  {unit.chosenGeneration?.outputUrl && (
                    <Image
                      src={unit.chosenGeneration.outputUrl}
                      alt={unit.sku?.name ?? ""}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{unit.stylePreset}</Badge>
                    <Badge tone="neutral">{unit.format}</Badge>
                    {unit.isTrendDrop && <Badge tone="trend">Trend</Badge>}
                  </div>
                  <div className="fw-540 text-body">{unit.sku?.name}</div>
                  <div className="flex gap-2">
                    <Button variant="black" className="flex-1">Download</Button>
                    <Button variant="white" className="flex-1">Copy caption</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-10 p-6">
            <h3 className="brand-subheading">How was this week?</h3>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant="white"
                  onClick={() => rate.mutate({ weekKey: activeWeek!, rating: n })}
                >
                  {n}★
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!weeks.data?.length && (
        <p className="mt-10 text-body fw-330 text-ink/70">
          No deliveries yet. Once your pilot is approved, week 1 starts producing.
        </p>
      )}
    </section>
  );
}
