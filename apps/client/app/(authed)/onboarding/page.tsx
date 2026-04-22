import { ConfirmOnboardingView } from "./_confirm";
import { MonoLabel } from "@wowcut/ui/components";

export const metadata = { title: "Confirm — Wowcut" };

export default function OnboardingPage() {
  return (
    <section className="max-w-[900px] mx-auto px-8 py-16">
      <MonoLabel>Welcome</MonoLabel>
      <h1 className="mt-3 brand-heading">Confirm and start</h1>
      <p className="mt-2 text-body-lg fw-330 text-ink/80">
        We saved everything from your preview. One click and your week 1 begins producing.
      </p>
      <div className="mt-10">
        <ConfirmOnboardingView />
      </div>
    </section>
  );
}
