"use client";
import { useState } from "react";
import Image from "next/image";
import { Card, MonoLabel, Badge, Button } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function QcQueuePage() {
  const queue = trpc.qc.queue.useQuery();
  const fp = trpc.qc.fpRate.useQuery();
  const approve = trpc.qc.bulkApprove.useMutation({ onSuccess: () => queue.refetch() });
  const retry = trpc.qc.bulkRetry.useMutation({ onSuccess: () => queue.refetch() });
  const [selected, setSelected] = useState<Record<string, string | null>>({});

  return (
    <section className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <MonoLabel>QC Review</MonoLabel>
          <h1 className="mt-3 brand-heading">Borderline queue</h1>
        </div>
        <div className="text-right">
          <MonoLabel size="sm" className="text-ink/60">Auto-approve FP rate</MonoLabel>
          <div className="text-[32px] leading-none fw-540 mt-1">
            {fp.data ? (fp.data.fpRate * 100).toFixed(1) : "—"}%
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="black"
          onClick={() => {
            const payload = Object.entries(selected)
              .filter(([, g]) => !!g)
              .map(([unitId, generationId]) => ({ unitId, generationId: generationId! }));
            if (payload.length) approve.mutate(payload);
          }}
        >
          Approve selected
        </Button>
        <Button
          variant="white"
          onClick={() =>
            retry.mutate(Object.keys(selected).map((unitId) => ({ unitId })))
          }
        >
          Retry selected
        </Button>
        <MonoLabel size="sm" className="text-ink/60 self-center">
          Shortcuts: 1/2/3 pick alt · A approve · R retry
        </MonoLabel>
      </div>

      <div className="mt-8 space-y-5">
        {queue.data?.map((unit) => (
          <Card key={unit.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="fw-540 text-body">{unit.client.name}</span>{" "}
                <span className="text-ink/60 text-body">— {unit.sku.name}</span>
              </div>
              <div className="flex gap-2">
                <Badge tone="neutral">{unit.stylePreset}</Badge>
                <Badge tone="neutral">{unit.format}</Badge>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {unit.generations.map((g) => {
                const picked = selected[unit.id] === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelected((p) => ({ ...p, [unit.id]: picked ? null : g.id }))}
                    className={`text-left rounded-lg overflow-hidden border-2 ${
                      picked ? "border-ink" : "border-ink/10 hover:border-ink/30"
                    }`}
                  >
                    <div className="aspect-square bg-ink/5 relative">
                      {g.outputUrl && (
                        <Image src={g.outputUrl} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <div className="p-2 text-[12px] fw-340 text-ink/70">
                      alt {g.alternateIndex} · {g.qcVerdict}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
        {queue.data?.length === 0 && (
          <p className="text-body fw-330 text-ink/60">Queue is empty. Auto-approve is doing its job.</p>
        )}
      </div>
    </section>
  );
}
