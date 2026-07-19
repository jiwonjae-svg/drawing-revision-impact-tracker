import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/data/auth";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  return <AppShell user={user}>{children}</AppShell>;
}

