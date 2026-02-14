import { LayoutShell } from "@/components/layout-shell";
import { requirePageSession } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession();
  return <LayoutShell>{children}</LayoutShell>;
}
