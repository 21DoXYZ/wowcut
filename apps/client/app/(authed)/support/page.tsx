"use client";
import { useState } from "react";
import { Button, Card, MonoLabel, Textarea } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function SupportPage() {
  const thread = trpc.support.thread.useQuery();
  const send = trpc.support.sendFromClient.useMutation({
    onSuccess: () => {
      setBody("");
      thread.refetch();
    },
  });
  const [body, setBody] = useState("");

  return (
    <section className="p-12 max-w-[720px]">
      <MonoLabel>Support</MonoLabel>
      <h1 className="mt-3 brand-subheading">Message your operator</h1>

      <Card className="mt-8 p-6 space-y-4">
        {thread.data?.length === 0 && (
          <p className="text-body fw-330 text-ink/60">No messages yet. Say hi.</p>
        )}
        {thread.data?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-lg text-body fw-340 ${
                msg.sender === "client" ? "bg-ink text-paper" : "bg-ink/5 text-ink"
              }`}
            >
              {msg.body}
            </div>
          </div>
        ))}
      </Card>

      <Card className="mt-4 p-4">
        <Textarea
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="mt-3 flex justify-end">
          <Button
            variant="black"
            onClick={() => send.mutate({ body })}
            disabled={!body.trim() || send.isPending}
          >
            Send
          </Button>
        </div>
      </Card>
    </section>
  );
}
