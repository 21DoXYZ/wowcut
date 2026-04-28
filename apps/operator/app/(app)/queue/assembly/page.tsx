"use client";
import Link from "next/link";
import { Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function AssemblyQueuePage() {
  const data = trpc.queue.assemblyStatus.useQuery(undefined, { refetchInterval: 15_000 });

  const assembling = data.data?.assembling ?? [];
  const recentDelivered = data.data?.recentDelivered ?? [];

  return (
    <section className="p-10 max-w-[1200px]">
      <div className="flex items-center mb-8">
        <div>
          <MonoLabel>Assembly queue</MonoLabel>
          <h1 className="mt-3 brand-heading">Remotion renders</h1>
        </div>
        <div className="ml-auto text-[12px] fw-330 text-ink/40">Refreshes every 15s</div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="brand-subheading">Currently assembling</h3>
          {assembling.length > 0 && (
            <Badge tone="warn" size="sm">{assembling.length} items</Badge>
          )}
        </div>

        {assembling.length === 0 ? (
          <p className="text-[14px] fw-330 text-ink/40">No items in assembly right now</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-ink/10 text-[12px] fw-480 uppercase tracking-[0.6px] text-ink/50">
              <tr>
                <th className="pb-2">Client</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Style</th>
                <th className="pb-2">Format</th>
                <th className="pb-2">Week</th>
                <th className="pb-2">QC</th>
              </tr>
            </thead>
            <tbody>
              {assembling.map((item) => (
                <tr key={item.id} className="border-b border-ink/5">
                  <td className="py-2 text-[13px] fw-480">
                    <Link href={`/clients/${item.clientId}`} className="hover:underline">
                      {item.client.name}
                    </Link>
                  </td>
                  <td className="py-2 text-[13px] text-ink/60">{item.sku.name}</td>
                  <td className="py-2 text-[12px]">
                    <Badge tone="neutral" size="sm">{item.stylePreset}</Badge>
                  </td>
                  <td className="py-2 text-[12px] text-ink/50">{item.format}</td>
                  <td className="py-2 text-[12px] text-ink/50">{item.weekKey}</td>
                  <td className="py-2 text-[12px]">
                    {item.chosenGeneration?.qcComposite != null
                      ? (
                        <span
                          className={
                            Number(item.chosenGeneration.qcComposite) >= 0.7
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {(Number(item.chosenGeneration.qcComposite) * 100).toFixed(0)}%
                        </span>
                      )
                      : <span className="text-ink/30">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="brand-subheading mb-4">Recently delivered</h3>
        {recentDelivered.length === 0 ? (
          <p className="text-[14px] fw-330 text-ink/40">No deliveries yet</p>
        ) : (
          <div className="space-y-3">
            {recentDelivered.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-[8px] border border-ink/8 px-4 py-3"
              >
                <div>
                  <div className="text-[14px] fw-480">{d.client.name}</div>
                  <div className="text-[12px] fw-330 text-ink/40 mt-0.5">
                    {d.weekKey} · {d.items.length} units
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {d.emailSentAt ? (
                    <Badge tone="ok" size="sm">Email sent</Badge>
                  ) : (
                    <Badge tone="warn" size="sm">Email pending</Badge>
                  )}
                  {d.publishingPackUrl && (
                    <a
                      href={d.publishingPackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] fw-430 underline text-ink/60 hover:text-ink"
                    >
                      Pack
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
