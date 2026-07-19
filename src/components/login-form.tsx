"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, CodeXml, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const demoAccounts = [
  { role: "Designer", email: "designer@drawingflow.demo", detail: "Create and submit revisions" },
  { role: "Reviewer", email: "reviewer@drawingflow.demo", detail: "Review, approve, and issue" },
  { role: "Production", email: "production@drawingflow.demo", detail: "Acknowledge and close" },
  { role: "Admin", email: "admin@drawingflow.demo", detail: "Manage the full workflow" },
  { role: "Viewer", email: "viewer@drawingflow.demo", detail: "Read-only inspection" },
];

export function LoginForm({ ssoProviders = [] }: { ssoProviders?: ("google" | "github")[] }) {
  const router = useRouter();
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState("Demo123!");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(selectedEmail = email) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", { email: selectedEmail, password, redirect: false });
    setPending(false);
    if (result?.error) {
      setError("The demo account could not be opened. Check the local database and password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <button key={account.email} type="button" disabled={pending} onClick={() => { setEmail(account.email); void submit(account.email); }} className="group flex min-h-20 items-center justify-between rounded-md border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 disabled:opacity-50">
            <span><span className="block text-sm font-semibold">{account.role}</span><span className="mt-1 block text-xs text-muted-foreground">{account.detail}</span></span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />Manual demo sign-in<span className="h-px flex-1 bg-border" /></div>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}Open command dashboard</Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">Shared portfolio password: <code className="font-mono text-foreground">Demo123!</code></p>
      {ssoProviders.length ? <><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />Approved-member SSO<span className="h-px flex-1 bg-border" /></div><div className="grid gap-2 sm:grid-cols-2">{ssoProviders.map((provider) => <Button key={provider} type="button" variant="outline" onClick={() => void signIn(provider, { callbackUrl: "/dashboard" })}>{provider === "github" ? <CodeXml /> : <KeyRound />}{provider === "github" ? "Continue with GitHub" : "Continue with Google"}</Button>)}</div><p className="text-center text-xs text-muted-foreground">SSO is limited to email addresses already approved in the project membership directory.</p></> : null}
    </div>
  );
}
