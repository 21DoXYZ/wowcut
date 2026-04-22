import { MonoLabel, Card } from "@wowcut/ui/components";

export default function AssemblyQueuePage() {
  return (
    <section className="p-10">
      <MonoLabel>Assembly queue</MonoLabel>
      <h1 className="mt-3 brand-heading">Remotion renders</h1>
      <Card className="mt-8 p-6">
        <p className="text-body fw-330 text-ink/70">
          Assembly queue view TODO — surface in-progress Remotion renders.
        </p>
      </Card>
    </section>
  );
}
