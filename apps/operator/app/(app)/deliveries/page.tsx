import { MonoLabel, Card } from "@wowcut/ui/components";

export default function OperatorDeliveriesPage() {
  return (
    <section className="p-10">
      <MonoLabel>Deliveries</MonoLabel>
      <h1 className="mt-3 brand-heading">Weekly delivery control</h1>
      <Card className="mt-8 p-6">
        <p className="text-body fw-330 text-ink/70">Bulk-send + per-client blockers TODO.</p>
      </Card>
    </section>
  );
}
