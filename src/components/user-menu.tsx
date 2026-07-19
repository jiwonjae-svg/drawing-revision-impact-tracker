"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, roleLabels } from "@/lib/format";
import type { UserRoleValue } from "@/lib/domain/revision-workflow";

export function UserMenu({ name, email, role, compact = false }: { name: string; email: string; role: UserRoleValue; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8 border"><AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
      {!compact ? <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{roleLabels[role]} · {email}</p></div> : null}
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Sign out" title="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut /></Button>
    </div>
  );
}

