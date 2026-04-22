import { MonoLabel, Card } from "@wowcut/ui/components";

export default function PlanPage() {
  return (
    <section className="p-10">
      <MonoLabel>Weekly plan</MonoLabel>
      <h1 className="mt-3 brand-heading">Cross-client planner</h1>
      <Card className="mt-8 p-6">
        <p className="text-body fw-330 text-ink/70">
          Bottleneck view TODO. Will show all client weeks × slots in one grid.
        </p>
      </Card>
    </section>
  );
}
