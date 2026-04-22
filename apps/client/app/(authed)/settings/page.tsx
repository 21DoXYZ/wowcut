import { Card, MonoLabel } from "@wowcut/ui/components";

export const metadata = { title: "Settings — Wowcut" };

export default function SettingsPage() {
  return (
    <section className="p-12 max-w-[720px]">
      <MonoLabel>Settings</MonoLabel>
      <h1 className="mt-3 brand-subheading">Account</h1>

      <Card className="mt-8 p-6 space-y-4">
        <h2 className="brand-subheading">Billing</h2>
        <p className="text-body fw-330 text-ink/70">Manage your subscription in Stripe.</p>
        <a
          href="/api/stripe/portal"
          className="brand-button-black inline-flex w-fit"
        >
          Open billing portal
        </a>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="brand-subheading">Trend drops</h2>
        <p className="mt-2 text-body fw-330 text-ink/70">
          Monthly themed bonus units (default on). TODO: toggle via tRPC.
        </p>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="brand-subheading">Email notifications</h2>
        <p className="mt-2 text-body fw-330 text-ink/70">
          Delivery ready, trend drops, brief reminders. TODO: preferences.
        </p>
      </Card>
    </section>
  );
}
