"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FileClock, LayoutDashboard, PlugZap, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Command dashboard", icon: LayoutDashboard },
  { href: "/drawings", label: "Drawing register", icon: FileClock },
  { href: "/review-queue", label: "Review queue", icon: ClipboardCheck },
  { href: "/audit", label: "Audit trail", icon: ScrollText },
  { href: "/integrations", label: "Integrations", icon: PlugZap },
  { href: "/settings", label: "Workflow settings", icon: Settings },
];

export function AppNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground")}> 
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
