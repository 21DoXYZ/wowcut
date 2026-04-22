import Link from "next/link";
import { Logo, Button, MonoLabel } from "@wowcut/ui/components";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-[1440px] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/try"
              className="hidden sm:inline-flex h-11 items-center px-4 text-[14px] fw-440 tracking-[-0.14px] text-ink hover:text-ink rounded-pill hover:bg-ink/5 transition-colors"
            >
              Try it free
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex h-11 items-center px-4 text-[14px] fw-440 tracking-[-0.14px] text-ink hover:text-ink rounded-pill hover:bg-ink/5 transition-colors"
            >
              Pricing
            </Link>
            <Link href="/sign-in">
              <Button variant="black" size="sm">Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-ink text-paper">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="paper" size="lg" />
            <p className="mt-4 text-[15px] fw-330 tracking-[-0.14px] text-paper/70 max-w-sm leading-[1.5]">
              Templated content production for beauty &amp; fashion brands. 20 on-brand assets, every month.
            </p>
          </div>
          <div>
            <MonoLabel size="sm" className="text-paper/45 mb-4 block">Product</MonoLabel>
            <ul className="space-y-2 text-[14px] fw-340 text-paper/85">
              <li><Link href="/try" className="hover:text-paper">Free preview</Link></li>
              <li><Link href="/pricing" className="hover:text-paper">Pricing</Link></li>
              <li><Link href="/gallery" className="hover:text-paper">Gallery</Link></li>
            </ul>
          </div>
          <div>
            <MonoLabel size="sm" className="text-paper/45 mb-4 block">Account</MonoLabel>
            <ul className="space-y-2 text-[14px] fw-340 text-paper/85">
              <li><Link href="/sign-in" className="hover:text-paper">Sign in</Link></li>
              <li><Link href="/support" className="hover:text-paper">Contact</Link></li>
            </ul>
          </div>
          <div>
            <MonoLabel size="sm" className="text-paper/45 mb-4 block">Legal</MonoLabel>
            <ul className="space-y-2 text-[14px] fw-340 text-paper/85">
              <li><Link href="/legal/terms" className="hover:text-paper">Terms</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-paper">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-paper/10">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
            <MonoLabel size="sm" className="text-paper/50">© Wowcut 2026</MonoLabel>
            <MonoLabel size="sm" className="text-paper/50">Made for beauty &amp; fashion</MonoLabel>
          </div>
        </div>
      </footer>
    </div>
  );
}
