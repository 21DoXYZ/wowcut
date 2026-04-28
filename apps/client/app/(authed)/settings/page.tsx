"use client";
import { Card, MonoLabel } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function SettingsPage() {
  const prefs = trpc.subscription.preferences.useQuery();
  const updatePrefs = trpc.subscription.updatePreferences.useMutation({
    onSuccess: () => prefs.refetch(),
  });

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
          Monthly themed bonus units added to your production plan.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-[14px] fw-430 text-ink">Receive monthly trend drops</div>
            <div className="text-[13px] fw-330 text-ink/50 mt-0.5">
              2 bonus units based on the monthly trend theme
            </div>
          </div>
          <Toggle
            checked={!(prefs.data?.trendDropOptOut ?? false)}
            disabled={prefs.isLoading || updatePrefs.isPending}
            onChange={(v) => updatePrefs.mutate({ trendDropOptOut: !v })}
          />
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="brand-subheading">Email notifications</h2>
        <p className="mt-2 text-body fw-330 text-ink/70">
          Control which emails you receive from Wowcut.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-[14px] fw-430 text-ink">Delivery and production updates</div>
            <div className="text-[13px] fw-330 text-ink/50 mt-0.5">
              Weekly delivery ready, trend drops, brief reminders
            </div>
          </div>
          <Toggle
            checked={prefs.data?.emailNotifications ?? true}
            disabled={prefs.isLoading || updatePrefs.isPending}
            onChange={(v) => updatePrefs.mutate({ emailNotifications: v })}
          />
        </div>
      </Card>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-ink" : "bg-ink/20"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-md transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
