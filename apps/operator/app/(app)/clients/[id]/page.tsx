"use client";
import { useState } from "react";
import { Card, MonoLabel, Badge, Button, Textarea, PillTabs } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function ClientWorkspacePage({ params }: { params: { id: string } }) {
  const client = trpc.clients.byId.useQuery({ id: params.id });
  const [tab, setTab] = useState("brief");
  const thread = trpc.support.threadForClient.useQuery(
    { clientId: params.id },
    { enabled: tab === "messages" },
  );
  const send = trpc.support.sendFromOperator.useMutation({
    onSuccess: () => {
      setReply("");
      thread.refetch();
    },
  });
  const [reply, setReply] = useState("");

  if (!client.data) return <div className="p-10 text-ink/60 fw-330">Loading…</div>;

  return (
    <section className="p-10">
      <MonoLabel>Client</MonoLabel>
      <div className="mt-3 flex items-center gap-4">
        <h1 className="brand-heading">{client.data.name}</h1>
        <Badge tone="neutral">{client.data.plan}</Badge>
        <Badge tone="neutral">{client.data.status}</Badge>
        <Badge
          tone={client.data.healthScore < 40 ? "warn" : client.data.healthScore < 70 ? "neutral" : "ok"}
        >
          health {client.data.healthScore}
        </Badge>
      </div>
      <p className="mt-2 text-body fw-330 text-ink/60">{client.data.email}</p>

      <div className="mt-8">
        <PillTabs
          tabs={[
            { id: "brief", label: "Brief" },
            { id: "assets", label: "Assets" },
            { id: "production", label: "Production" },
            { id: "messages", label: "Messages" },
            { id: "health", label: "Health" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-8">
        {tab === "brief" && (
          <Card className="p-6">
            <h3 className="brand-subheading">Brief</h3>
            <pre className="mt-4 text-[13px] fw-330 text-ink/80 overflow-auto">
              {JSON.stringify(client.data.brief ?? {}, null, 2)}
            </pre>
          </Card>
        )}
        {tab === "assets" && (
          <Card className="p-6">
            <h3 className="brand-subheading">SKUs ({client.data.skus.length})</h3>
            <ul className="mt-4 space-y-2">
              {client.data.skus.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Badge tone="neutral">{s.category}</Badge>
                  <span className="fw-540 text-body">{s.name}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {tab === "production" && (
          <Card className="p-6">
            <h3 className="brand-subheading">Production</h3>
            <p className="mt-2 text-body fw-330 text-ink/60">
              Recent deliveries: {client.data.deliveries.length}
            </p>
          </Card>
        )}
        {tab === "messages" && (
          <Card className="p-6">
            <h3 className="brand-subheading">Thread</h3>
            <div className="mt-4 space-y-3">
              {thread.data?.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "operator" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-lg text-body fw-340 ${
                      m.sender === "operator" ? "bg-ink text-paper" : "bg-ink/5 text-ink"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply to client…"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  variant="black"
                  onClick={() => send.mutate({ clientId: params.id, body: reply })}
                  disabled={!reply.trim() || send.isPending}
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        )}
        {tab === "health" && (
          <Card className="p-6">
            <h3 className="brand-subheading">Health signals</h3>
            <ul className="mt-4 space-y-2 text-body fw-340">
              <li>Health score: {client.data.healthScore}/100</li>
              <li>Weekly logins: {client.data.weeklyLoginCount}</li>
              <li>Last login: {client.data.lastLoginAt?.toString() ?? "—"}</li>
              <li>Recent brief updates: {client.data.briefUpdates.length}</li>
            </ul>
          </Card>
        )}
      </div>
    </section>
  );
}
