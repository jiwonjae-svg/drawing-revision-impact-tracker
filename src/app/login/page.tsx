import { redirect } from "next/navigation";
import { DraftingCompass, LockKeyhole, Network, ScrollText } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const ssoProviders = [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? ["google" as const] : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET ? ["github" as const] : []),
  ];
  return (
    <main className="min-h-screen bg-[#17202a] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-background shadow-2xl sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#1e2933] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-cyan-300 text-slate-950"><DraftingCompass className="size-5" /></span><div><p className="font-semibold">DrawingFlow</p><p className="text-xs text-white/55">Drawing Revision Impact Tracker</p></div></div>
          <div className="relative max-w-lg">
            <p className="mb-3 font-mono text-xs uppercase text-cyan-300">Controlled change workflow</p>
            <h1 className="text-4xl font-semibold leading-tight">Trace every drawing change from review to field acknowledgement.</h1>
            <div className="mt-8 grid gap-4 text-sm text-white/70">
              <p className="flex items-center gap-3"><Network className="size-4 text-cyan-300" /> Impact links across drawings, processes, and work packages</p>
              <p className="flex items-center gap-3"><LockKeyhole className="size-4 text-cyan-300" /> Role-separated review, approval, issue, and close controls</p>
              <p className="flex items-center gap-3"><ScrollText className="size-4 text-cyan-300" /> Database-enforced, append-only audit trail</p>
            </div>
          </div>
          <p className="relative text-xs text-white/45">Independent portfolio project using synthetic manufacturing data only.</p>
        </section>
        <section className="flex items-center px-5 py-10 sm:px-10 lg:px-14"><div className="mx-auto w-full max-w-xl"><p className="text-xs font-semibold uppercase text-primary">Role-based demo</p><h2 className="mt-2 text-2xl font-semibold">Choose a workflow role</h2><p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">Each account opens the same synthetic project data with different permissions.</p><LoginForm ssoProviders={ssoProviders} /></div></section>
      </div>
    </main>
  );
}
