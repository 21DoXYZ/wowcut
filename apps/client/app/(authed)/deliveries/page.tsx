"use client";
import Image from "next/image";
import { Button, Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function DeliveriesPage() {
  const weeks = trpc.delivery.listWeeks.useQuery();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  // Fall back to first week automatically when data loads
  const activeWeek = selectedWeek ?? weeks.data?.[0]?.weekKey ?? null;

  const week = trpc.delivery.byWeek.useQuery(
    { weekKey: activeWeek ?? "" },
    { enabled: !!activeWeek },
  );
  const rate = trpc.delivery.rateWeek.useMutation();

  return (
    <section className="p-12 max-w-[1200px]">
      <MonoLabel>Deliveries</MonoLabel>
      <h1 className="mt-3 brand-subheading">Your weekly content</h1>

      {/* Week tabs */}
      {!!weeks.data?.length && (
        <div className="mt-8 flex gap-2 flex-wrap">
          {weeks.data.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWeek(w.weekKey)}
              data-active={activeWeek === w.weekKey}
              className="brand-pill-tab bg-ink/5 data-[active=true]:bg-ink data-[active=true]:text-paper"
            >
              {w.weekKey}
            </button>
          ))}
        </div>
      )}

      {/* Content grid */}
      {week.data && (
        <div className="mt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {week.data.items.map((unit) => (
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
                    {unit.chosenGeneration?.outputUrl ? (
                      <a
                        href={unit.chosenGeneration.outputUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="black" className="w-full">Download</Button>
                      </a>
                    ) : (
                      <Button variant="black" className="flex-1" disabled>Download</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Publishing pack download */}
          {week.data.publishingPackUrl && (
            <div className="mt-6 flex items-center gap-4 p-5 border border-ink/10 rounded-[14px]">
              <div className="flex-1">
                <p className="text-[14px] fw-540 text-ink">Publishing pack</p>
                <p className="text-[13px] fw-330 text-ink/50 mt-0.5">
                  CSV with captions, hashtags, and suggested schedule
                </p>
              </div>
              <a href={week.data.publishingPackUrl} download target="_blank" rel="noopener noreferrer">
                <Button variant="white">Download CSV</Button>
              </a>
            </div>
          )}

          {/* Rating */}
          <Card className="mt-8 p-6">
            <h3 className="brand-subheading">How was this week?</h3>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant="white"
                  loading={rate.isPending}
                  onClick={() => rate.mutate({ weekKey: activeWeek!, rating: n })}
                >
                  {n}★
                </Button>
              ))}
            </div>
            {rate.isSuccess && (
              <p className="mt-3 text-[13px] fw-330 text-ink/50">Thanks for the feedback.</p>
            )}
          </Card>
        </div>
      )}

      {week.isLoading && activeWeek && (
        <p className="mt-10 text-body fw-330 text-ink/50">Loading...</p>
      )}

      {!weeks.isLoading && !weeks.data?.length && (
        <p className="mt-10 text-body fw-330 text-ink/70">
          No deliveries yet. Once your pilot is approved, week 1 starts producing.
        </p>
      )}
    </section>
  );
}
