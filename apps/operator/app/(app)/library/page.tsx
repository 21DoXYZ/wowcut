import { MonoLabel, Card } from "@wowcut/ui/components";

export default function OperatorLibraryPage() {
  return (
    <section className="p-10">
      <MonoLabel>Global library</MonoLabel>
      <h1 className="mt-3 brand-heading">House assets</h1>
      <Card className="mt-8 p-6">
        <p className="text-body fw-330 text-ink/70">
          Backgrounds, Remotion templates, BrandFace references, CTA overlays. TODO.
        </p>
      </Card>
    </section>
  );
}
