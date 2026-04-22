"use client";
import Link from "next/link";
import { Card, MonoLabel, Badge } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function ClientsListPage() {
  const clients = trpc.clients.list.useQuery();

  return (
    <section className="p-10">
      <MonoLabel>Clients</MonoLabel>
      <h1 className="mt-3 brand-heading">All clients</h1>

      <Card className="mt-8 p-6">
        <table className="w-full text-left text-body fw-340">
          <thead className="border-b border-ink/10 text-[13px] fw-480 uppercase tracking-[0.6px]">
            <tr>
              <th className="py-2 pr-4">Brand</th>
              <th className="py-2 pr-4">Email</th>
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
                <td className="py-2 pr-4 text-ink/60">{c.email}</td>
                <td className="py-2 pr-4">{c.plan}</td>
                <td className="py-2 pr-4">{c.status}</td>
                <td className="py-2 pr-4">
                  <Badge
                    tone={c.healthScore < 40 ? "warn" : c.healthScore < 70 ? "neutral" : "ok"}
                  >
                    {c.healthScore}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
