"use client";
import Link from "next/link";
import { Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export const metadata = { title: "Generation queue" };

const STATUS_TONE: Record<string, "ok" | "warn" | "ink" | "neutral"> = {
  planned: "neutral",
  generating: "warn",
  auto_qc: "warn",
  needs_review: "ink",
  ready: "ok",
  delivered: "ok",
  failed: "ink",
  assembling: "warn",
};

export default function GenerationQueuePage() {
  const data = trpc.queue.generationStatus.useQuery(undefined, { refetchInterval: 15_000 });

  const byStatus = data.data?.byStatus ?? [];
  const failed = data.data?.recentFailed ?? [];
  const succeeded = data.data?.recentSucceeded ?? [];

  const totalActive = byStatus
    .filter((r) => !["delivered", "archived"].includes(r.status))
    .reduce((s, r) => s + r._count.id, 0);

  return (
    <section className="p-10 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <MonoLabel>Generation queue</MonoLabel>
          <h1 className="mt-3 brand-heading">Active jobs</h1>
        </div>
        <div className="ml-auto text-[12px] fw-330 text-ink/40">
          Refreshes every 15s
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-8">
        <StatCard
          label="Active (non-delivered)"
          value={totalActive}
        />
        <StatCard
          label="Needs review"
          value={byStatus.find((r) => r.status === "needs_review")?._count.id ?? 0}
          warn
        />
        <StatCard
          label="Failed (recent)"
          value={failed.length}
          warn={failed.length > 0}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="brand-subheading mb-4">Status breakdown</h3>
          <div className="space-y-2">
            {byStatus
              .sort((a, b) => b._count.id - a._count.id)
              .map((row) => (
                <div key={row.status} className="flex items-center justify-between">
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"} size="sm">
                    {row.status}
                  </Badge>
                  <span className="text-[15px] fw-540">{row._count.id}</span>
                </div>
              ))}
            {byStatus.length === 0 && (
              <p className="text-[14px] fw-330 text-ink/40">No active items</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="brand-subheading mb-4">Recent succeeded</h3>
          <div className="space-y-3">
            {succeeded.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] fw-480">
                    {g.unit?.client.name ?? "-"} — {g.unit?.stylePreset}
                  </div>
                  <div className="text-[12px] fw-330 text-ink/40 mt-0.5">
                    {g.model} · {g.latencyMs ? `${(g.latencyMs / 1000).toFixed(1)}s` : "?"} ·
                    ${Number(g.costUsd ?? 0).toFixed(3)}
                    {g.autoApproved && (
                      <span className="ml-2 text-green-600">auto-approved</span>
                    )}
                  </div>
                </div>
                {g.unit && (
                  <Link href={`/clients/${g.unit?.client?.slug ?? ""}`}>
                    <span className="text-[12px] fw-330 text-ink/40 hover:text-ink">
                      {g.unit.weekKey}
                    </span>
                  </Link>
                )}
              </div>
            ))}
            {succeeded.length === 0 && (
              <p className="text-[14px] fw-330 text-ink/40">None yet</p>
            )}
          </div>
        </Card>
      </div>

      {failed.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="brand-subheading mb-4 text-red-600">Failed generations</h3>
          <table className="w-full text-left">
            <thead className="border-b border-ink/10 text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/50">
              <tr>
                <th className="pb-2">Client</th>
                <th className="pb-2">Style</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Error</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {failed.map((g) => (
                <tr key={g.id} className="border-b border-ink/5">
                  <td className="py-2 text-[13px] fw-480">
                    {g.unit?.client.name ?? "-"}
                  </td>
                  <td className="py-2 text-[13px] text-ink/60">{g.unit?.stylePreset ?? "-"}</td>
                  <td className="py-2 text-[12px] text-ink/50">{g.model}</td>
                  <td className="py-2 text-[12px] text-red-500 max-w-[240px] truncate">
                    {g.errorMessage ?? "Unknown"}
                  </td>
                  <td className="py-2 text-[12px] text-ink/40">
                    {new Date(g.updatedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <Card className="p-5">
      <div
        className={`text-[28px] fw-540 tracking-[-0.5px] ${
          warn && value > 0 ? "text-red-500" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] fw-340 text-ink/50">{label}</div>
    </Card>
  );
}
