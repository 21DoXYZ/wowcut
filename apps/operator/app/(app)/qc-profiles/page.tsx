"use client";
import { Card, MonoLabel, Button, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function QcProfilesPage() {
  const profiles = trpc.qc.profiles.useQuery();
  const proposals = trpc.qc.calibrationProposals.useQuery();
  const apply = trpc.qc.applyCalibration.useMutation({
    onSuccess: () => {
      profiles.refetch();
      proposals.refetch();
    },
  });

  return (
    <section className="p-10 max-w-[1400px]">
      <MonoLabel>QC profiles</MonoLabel>
      <h1 className="mt-3 brand-heading">Style thresholds</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {profiles.data?.map((p) => (
          <Card key={p.id} className="p-6">
            <h3 className="brand-subheading">{p.stylePreset.replace(/_/g, " ")}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-body fw-340">
              <dt className="text-ink/60">Auto-approve</dt>
              <dd>{p.compositeAutoApprove}</dd>
              <dt className="text-ink/60">Pass threshold</dt>
              <dd>{p.compositePass}</dd>
              <dt className="text-ink/60">Product identity min</dt>
              <dd>{p.productIdentityMin}</dd>
              <dt className="text-ink/60">Aesthetic min</dt>
              <dd>{p.aestheticMin}</dd>
              <dt className="text-ink/60">Brand ΔE max</dt>
              <dd>{p.brandColorDeltaMax}</dd>
            </dl>
          </Card>
        ))}
      </div>

      <Card className="mt-10 p-6">
        <h2 className="brand-subheading">Calibration proposals</h2>
        <p className="mt-2 text-body fw-330 text-ink/60">
          Weekly job compares operator decisions to current thresholds. Apply if the proposed number
          improves accuracy.
        </p>
        <div className="mt-6 space-y-3">
          {proposals.data?.length === 0 && (
            <p className="text-body fw-330 text-ink/50">No proposals yet.</p>
          )}
          {proposals.data?.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border border-ink/10">
              <div>
                <Badge tone="neutral">{r.stylePreset}</Badge>
                <div className="mt-2 text-body fw-340">
                  {r.currentThreshold} → <span className="fw-540">{r.proposedThreshold}</span>
                  <span className="ml-3 text-ink/60 text-[13px] fw-330">
                    predicted accuracy {(r.predictedAccuracy * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {r.status === "pending" ? (
                  <Button
                    variant="black"
                    onClick={() => apply.mutate({ runId: r.id })}
                  >
                    Apply
                  </Button>
                ) : (
                  <Badge tone="ok">{r.status}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
