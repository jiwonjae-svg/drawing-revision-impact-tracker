import { DraftingCompass } from "lucide-react";
import { AppNavigation } from "@/components/app-navigation";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SyntheticDataBanner } from "@/components/synthetic-data-banner";
import { UserMenu } from "@/components/user-menu";
import type { UserRoleValue } from "@/lib/domain/revision-workflow";

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: UserRoleValue } }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5"><div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><DraftingCompass className="size-4" /></div><div><p className="text-sm font-semibold">DrawingFlow</p><p className="text-[11px] text-sidebar-foreground/55">Manufacturing DX control</p></div></div>
        <div className="flex-1 px-3 py-4"><AppNavigation /></div>
        <div className="border-t border-sidebar-border p-3 [&_.text-muted-foreground]:text-sidebar-foreground/55"><UserMenu {...user} /></div>
      </aside>
      <div className="md:pl-60">
        <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur md:hidden"><div className="flex h-14 items-center justify-between px-4"><div className="flex items-center gap-2"><MobileNavigation /><span className="text-sm font-semibold">DrawingFlow</span></div><UserMenu {...user} compact /></div></div>
        <SyntheticDataBanner />
        <main className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

