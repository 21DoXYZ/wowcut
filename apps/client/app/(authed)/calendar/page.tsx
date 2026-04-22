"use client";
import { MonoLabel, Card, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function CalendarPage() {
  const data = trpc.calendar.upcomingWeeks.useQuery();

  return (
    <section className="p-12 max-w-[1400px]">
      <MonoLabel>Calendar</MonoLabel>
      <h1 className="mt-3 brand-subheading">Four weeks ahead</h1>
      <p className="mt-2 text-body fw-330 text-ink/70">
        Your content plan at a glance. Click a slot to see status or request a SKU for next week.
      </p>

      <div className="mt-8 space-y-6">
        {Object.entries(data.data ?? {}).map(([weekKey, items]) => (
          <Card key={weekKey} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="brand-subheading">{weekKey}</h3>
              <Badge tone="neutral">{items.length} units</Badge>
            </div>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {items.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-ink/10 p-3 text-[13px] fw-330"
                >
                  <div className="fw-540 text-body">{unit.sku?.name}</div>
                  <div className="text-ink/60">{unit.stylePreset}</div>
                  <div className="text-ink/40 mt-1">{unit.format}</div>
                  <div className="mt-2">
                    <Badge
                      tone={
                        unit.status === "delivered"
                          ? "ok"
                          : unit.status === "failed"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {unit.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
