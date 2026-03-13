import Link from "next/link";
import { TopNav } from "@/components/shared/top-nav";
import { CartDrawer } from "@/components/customer/cart-drawer";
import { PLATFORM_NAME } from "@/lib/constants";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <CartDrawer />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.</p>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
