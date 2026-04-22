import { TryWizard } from "./_wizard";
import { MonoLabel } from "@wowcut/ui/components";

export const metadata = { title: "See your brand in Wowcut — free preview" };

export default function TryPage() {
  return (
    <section className="max-w-[720px] mx-auto px-6 py-16 md:py-24">
      <MonoLabel>Free preview</MonoLabel>
      <h1 className="mt-4 brand-heading">See your brand in Wowcut style.</h1>
      <p className="mt-4 text-body-lg fw-330 tracking-tight-sm text-ink/80">
        60-90 seconds, no signup. We build a 9-image moodboard of your brand — 3 styles, 3 directions each.
      </p>
      <div className="mt-10">
        <TryWizard />
      </div>
    </section>
  );
}
