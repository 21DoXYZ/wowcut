"use client";
import Link from "next/link";
import { Card, MonoLabel, Badge, Button } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const clients = trpc.clients.list.useQuery();
  const alerts = trpc.clients.healthAlerts.useQuery();
  const qcQueue = trpc.qc.queue.useQuery();
  const metrics = trpc.metrics.overview.useQuery();

  return (
    <section className="p-10">
      <MonoLabel>Dashboard</MonoLabel>
      <h1 className="mt-3 brand-heading">Today</h1>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <Stat label="Clients" value={metrics.data?.activeClients ?? "—"} />
        <Stat label="MRR" value={metrics.data ? `$${metrics.data.mrr.toLocaleString()}` : "—"} />
        <Stat label="Units delivered" value={metrics.data?.deliveredUnits ?? "—"} />
        <Stat label="Previews today" value={metrics.data?.previewsToday ?? "—"} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="brand-subheading">Health alerts</h3>
          {alerts.data?.length === 0 && (
            <p className="mt-2 text-body fw-330 text-ink/60">All clients above 60.</p>
          )}
          <ul className="mt-4 divide-y divide-ink/5">
            {alerts.data?.map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="fw-540 text-body">{c.name}</div>
                  <div className="text-[13px] fw-330 text-ink/60">
                    Status: {c.status} • Last login: {c.lastLoginAt ? c.lastLoginAt.toString() : "—"}
                  </div>
                </div>
                <Badge tone={c.healthScore < 40 ? "warn" : "neutral"}>{c.healthScore}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="brand-subheading">QC queue</h3>
          <p className="mt-2 text-body fw-330 text-ink/60">
            {qcQueue.data?.length ?? 0} borderline units awaiting review
          </p>
          <Link href="/queue/qc">
            <Button variant="black" className="mt-4">Open QC</Button>
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="brand-subheading">All clients</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-body fw-340">
            <thead className="border-b border-ink/10 text-[13px] fw-480 uppercase tracking-[0.6px]">
              <tr>
                <th className="py-2 pr-4">Brand</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Health</th>
              </tr>
            </thead>
            <tbody>
              {clients.data?.map((c) => (
                <tr key={c.id} className="border-b border-ink/5">
                  <td className="py-2 pr-4">
                    <Link href={`/clients/${c.id}`} className="underline underline-offset-4">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{c.plan}</td>
                  <td className="py-2 pr-4">{c.status}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={c.healthScore < 40 ? "warn" : c.healthScore < 70 ? "neutral" : "ok"}>
                      {c.healthScore}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
