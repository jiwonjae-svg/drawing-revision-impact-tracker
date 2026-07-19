import { execFileSync } from "node:child_process";

export default function globalTeardown() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath is required to reset the E2E database.");

  execFileSync(process.execPath, [npmCli, "run", "db:seed"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
