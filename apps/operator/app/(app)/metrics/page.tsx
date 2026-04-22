"use client";
import { Card, MonoLabel } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function MetricsPage() {
  const overview = trpc.metrics.overview.useQuery();
  const byModel = trpc.metrics.apiCostByDay.useQuery();

  return (
    <section className="p-10 max-w-[1200px]">
      <MonoLabel>Metrics</MonoLabel>
      <h1 className="mt-3 brand-heading">Business</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="Total clients" value={overview.data?.totalClients ?? "—"} />
        <Stat label="Active clients" value={overview.data?.activeClients ?? "—"} />
        <Stat label="MRR" value={overview.data ? `$${overview.data.mrr.toLocaleString()}` : "—"} />
        <Stat label="Previews 24h" value={overview.data?.previewsToday ?? "—"} />
      </div>

      <Card className="mt-10 p-6">
        <h3 className="brand-subheading">API cost by model (30d)</h3>
        <table className="w-full mt-4 text-left text-body fw-340">
          <thead className="border-b border-ink/10 text-[13px] fw-480 uppercase tracking-[0.6px]">
            <tr>
              <th className="py-2">Model</th>
              <th className="py-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {byModel.data?.map((row) => (
              <tr key={row.model} className="border-b border-ink/5">
                <td className="py-2">{row.model}</td>
                <td className="py-2">${Number(row._sum.costUsd ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <MonoLabel size="sm" className="text-ink/60">{label}</MonoLabel>
      <div className="mt-2 text-[40px] leading-none font-[540] tracking-[-0.64px]">{value}</div>
    </Card>
  );
}
