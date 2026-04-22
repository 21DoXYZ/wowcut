"use client";
import Image from "next/image";
import { Card, MonoLabel, Button, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function ConfidenceQueuePage() {
  const queue = trpc.qc.confidenceQueue.useQuery();
  const fpRate = trpc.qc.fpRate.useQuery();
  const submit = trpc.qc.submitConfidenceVerdict.useMutation({
    onSuccess: () => {
      queue.refetch();
      fpRate.refetch();
    },
  });

  return (
    <section className="p-10 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <MonoLabel>Confidence review</MonoLabel>
          <h1 className="mt-3 brand-heading">Auto-approve sample audit</h1>
          <p className="mt-2 text-body fw-330 text-ink/70 max-w-xl">
            5% of auto-approved generations sampled here. Flag ones that shouldn&rsquo;t have passed.
          </p>
        </div>
        <div className="text-right">
          <MonoLabel size="sm" className="text-ink/60">FP rate</MonoLabel>
          <div className="mt-1 text-[32px] fw-540">
            {fpRate.data ? (fpRate.data.fpRate * 100).toFixed(1) : "—"}%
          </div>
          <div className="text-[13px] fw-330 text-ink/50 mt-1">
            {fpRate.data?.total ?? 0} reviewed
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {queue.data?.length === 0 && (
          <p className="text-body fw-330 text-ink/60">Queue empty. Come back next week.</p>
        )}
        {queue.data?.map((gen) => (
          <Card key={gen.id} className="p-5 flex flex-col md:flex-row gap-5">
            <div className="md:w-64 aspect-square bg-ink/5 rounded-lg relative overflow-hidden">
              {gen.outputUrl && <Image src={gen.outputUrl} alt="" fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{gen.unit?.client.name}</Badge>
                <Badge tone="neutral">{gen.unit?.stylePreset}</Badge>
                <Badge tone="ok">auto-approved</Badge>
                <Badge tone="neutral">composite {gen.qcComposite?.toFixed(1) ?? "—"}</Badge>
              </div>
              <div className="mt-3 fw-540 text-body">{gen.unit?.sku.name}</div>
              <pre className="mt-3 text-[12px] fw-330 text-ink/60 overflow-auto max-h-40 bg-ink/5 p-3 rounded-lg">
{JSON.stringify(gen.qcResult, null, 2)}
              </pre>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="black"
                  onClick={() =>
                    submit.mutate({ generationId: gen.id, verdict: "approve" })
                  }
                >
                  Confirm approve
                </Button>
                <Button
                  variant="white"
                  onClick={() =>
                    submit.mutate({ generationId: gen.id, verdict: "reject" })
                  }
                >
                  Should have rejected
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
