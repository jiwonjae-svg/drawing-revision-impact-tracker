"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppNavigation } from "@/components/app-navigation";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" />}><Menu /></SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-sidebar text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border"><SheetTitle className="text-sidebar-foreground">DrawingFlow</SheetTitle><SheetDescription className="text-sidebar-foreground/60">Revision impact control</SheetDescription></SheetHeader>
        <div className="px-3"><AppNavigation onNavigate={() => setOpen(false)} /></div>
      </SheetContent>
    </Sheet>
  );
}

