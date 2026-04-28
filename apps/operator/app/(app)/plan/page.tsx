"use client";
import Link from "next/link";
import { Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

const STATUS_COLOR: Record<string, string> = {
  planned: "bg-ink/10 text-ink/40",
  generating: "bg-yellow-100 text-yellow-700",
  auto_qc: "bg-blue-50 text-blue-600",
  needs_review: "bg-red-50 text-red-600",
  ready: "bg-green-50 text-green-600",
  assembling: "bg-purple-50 text-purple-600",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const BOTTLENECK_LABEL: Record<string, string> = {
  generating: "Generating",
  auto_qc: "In QC",
  needs_review: "Needs review",
  assembling: "Assembling",
};

export default function PlanPage() {
  const grid = trpc.plan.crossClientGrid.useQuery({ weeksAhead: 4 });
  const bottlenecks = trpc.plan.bottlenecks.useQuery();

  return (
    <section className="p-10 max-w-[1400px]">
      <MonoLabel>Weekly plan</MonoLabel>
      <h1 className="mt-3 brand-heading">Cross-client planner</h1>

      {bottlenecks.data && bottlenecks.data.length > 0 && (
        <Card className="mt-6 p-5">
          <h3 className="text-[14px] fw-540 tracking-[-0.14px] mb-3">
            Active bottlenecks
          </h3>
          <div className="flex flex-wrap gap-3">
            {bottlenecks.data.map((b, i) => (
              <Link key={i} href={`/clients/${b.clientId}`}>
                <div className="flex items-center gap-2 rounded-[8px] border border-ink/10 px-3 py-2 hover:border-ink/30 transition-colors">
                  <span className="text-[13px] fw-480">{b.clientName}</span>
                  <Badge tone={b.status === "needs_review" ? "ink" : "warn"} size="sm">
                    {BOTTLENECK_LABEL[b.status] ?? b.status} x{b.count}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8 overflow-x-auto">
        {grid.isLoading && (
          <div className="text-[14px] fw-330 text-ink/40">Loading...</div>
        )}

        {grid.data && (
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/50 py-3 pr-4 w-[180px]">
                  Client
                </th>
                {grid.data.weekKeys.map((wk) => (
                  <th
                    key={wk}
                    className="text-left text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/50 py-3 px-3"
                  >
                    {wk}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.data.clients.map((client) => (
                <tr key={client.id} className="border-t border-ink/6">
                  <td className="py-3 pr-4">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      <div className="text-[14px] fw-480 truncate max-w-[160px]">{client.name}</div>
                      <div className="text-[12px] fw-330 text-ink/40">{client.plan}</div>
                    </Link>
                  </td>
                  {grid.data.weekKeys.map((wk) => {
                    const cell = grid.data.grid[client.id]?.[wk] ?? {};
                    const entries = Object.entries(cell).filter(([, count]) => count > 0);
                    const total = entries.reduce((s, [, c]) => s + c, 0);
                    return (
                      <td key={wk} className="py-3 px-3 align-top">
                        {total === 0 ? (
                          <span className="text-[12px] text-ink/20">-</span>
                        ) : (
                          <div className="space-y-1">
                            {entries
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([status, count]) => (
                                <div
                                  key={status}
                                  className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[11px] fw-480 mr-1 ${STATUS_COLOR[status] ?? "bg-ink/10 text-ink/40"}`}
                                >
                                  {count} {status}
                                </div>
                              ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {grid.data.clients.length === 0 && (
                <tr>
                  <td
                    colSpan={grid.data.weekKeys.length + 1}
                    className="py-8 text-center text-[14px] fw-330 text-ink/40"
                  >
                    No active clients
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
