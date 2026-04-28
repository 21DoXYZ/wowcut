"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, MonoLabel, Badge, Button } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

const STATUS_BADGE: Record<string, "ok" | "warn" | "neutral" | "ink"> = {
  delivered: "ok",
  ready: "ok",
  assembling: "warn",
  generating: "warn",
  auto_qc: "warn",
  needs_review: "ink",
  failed: "ink",
  planned: "neutral",
};

export default function OperatorDeliveriesPage() {
  const recentWeeks = trpc.delivery.recentWeeks.useQuery();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined);

  const weekKey = selectedWeek ?? recentWeeks.data?.[0];
  const summary = trpc.delivery.weekSummary.useQuery(
    { weekKey },
    { enabled: !!weekKey },
  );

  const statusCounts = summary.data?.unitsByStatus ?? [];
  const total = statusCounts.reduce((s, r) => s + r._count.status, 0);

  return (
    <section className="p-10 max-w-[1200px]">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <MonoLabel>Deliveries</MonoLabel>
          <h1 className="mt-3 brand-heading">Weekly delivery control</h1>
        </div>
        {recentWeeks.data && recentWeeks.data.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] fw-340 text-ink/50">Week:</span>
            <select
              className="text-[14px] fw-430 border border-ink/20 rounded-[8px] px-3 py-2 bg-paper"
              value={weekKey ?? ""}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {recentWeeks.data.map((wk) => (
                <option key={wk} value={wk}>{wk}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {summary.isLoading && (
        <div className="text-[14px] fw-330 text-ink/40">Loading...</div>
      )}

      {summary.data && (
        <>
          <div className="grid gap-3 md:grid-cols-4 mb-8">
            <StatCard label="Total units" value={total} />
            <StatCard
              label="Delivered"
              value={statusCounts.find((r) => r.status === "delivered")?._count.status ?? 0}
              accent
            />
            <StatCard
              label="Needs review"
              value={statusCounts.find((r) => r.status === "needs_review")?._count.status ?? 0}
              warn
            />
            <StatCard
              label="Clients without delivery"
              value={summary.data.blockers.length}
              warn={summary.data.blockers.length > 0}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="brand-subheading mb-4">Unit status breakdown</h3>
              <div className="space-y-2">
                {statusCounts
                  .sort((a, b) => b._count.status - a._count.status)
                  .map((row) => (
                    <div key={row.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_BADGE[row.status] ?? "neutral"} size="sm">
                          {row.status}
                        </Badge>
                      </div>
                      <span className="text-[14px] fw-540">{row._count.status}</span>
                    </div>
                  ))}
                {statusCounts.length === 0 && (
                  <p className="text-[14px] fw-330 text-ink/40">No units this week</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="brand-subheading mb-4">
                Blockers
                {summary.data.blockers.length > 0 && (
                  <span className="ml-2 text-[13px] fw-330 text-red-500">
                    {summary.data.blockers.length} missing
                  </span>
                )}
              </h3>
              {summary.data.blockers.length === 0 ? (
                <p className="text-[14px] fw-330 text-green-600">All active clients delivered</p>
              ) : (
                <div className="space-y-2">
                  {summary.data.blockers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-[14px] fw-480">{c.name}</span>
                        <span className="ml-2 text-[12px] fw-330 text-ink/40">{c.plan}</span>
                      </div>
                      <Link href={`/clients/${c.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <h3 className="brand-subheading mb-4">Deliveries sent this week</h3>
            {summary.data.deliveries.length === 0 ? (
              <p className="text-[14px] fw-330 text-ink/40">No deliveries sent yet for {weekKey}</p>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b border-ink/10 text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/50">
                  <tr>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">Email sent</th>
                    <th className="pb-2">Pack</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.deliveries.map((d) => (
                    <tr key={d.id} className="border-b border-ink/5 text-[14px] fw-340">
                      <td className="py-3">
                        <Link href={`/clients/${d.clientId}`} className="fw-480 hover:underline">
                          {d.client.name}
                        </Link>
                      </td>
                      <td className="py-3 text-ink/50">{d.client.plan}</td>
                      <td className="py-3">
                        {d.emailSentAt ? (
                          <Badge tone="ok" size="sm">Sent</Badge>
                        ) : (
                          <Badge tone="warn" size="sm">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {d.publishingPackUrl ? (
                          <a
                            href={d.publishingPackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] fw-430 underline"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-ink/30">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Card className="p-5">
      <div
        className={`text-[28px] fw-540 tracking-[-0.5px] ${
          accent ? "text-green-600" : warn && Number(value) > 0 ? "text-red-500" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] fw-340 tracking-[-0.1px] text-ink/50">{label}</div>
    </Card>
  );
}
