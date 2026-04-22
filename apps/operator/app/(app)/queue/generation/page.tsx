import { MonoLabel, Card } from "@wowcut/ui/components";

export const metadata = { title: "Generation queue" };

export default function GenerationQueuePage() {
  return (
    <section className="p-10">
      <MonoLabel>Generation queue</MonoLabel>
      <h1 className="mt-3 brand-heading">Queue</h1>
      <Card className="mt-8 p-6">
        <p className="text-body fw-330 text-ink/70">
          BullMQ dashboard embed TODO. Until then, inspect via <code>bull-board</code> on the worker service.
        </p>
      </Card>
    </section>
  );
}
