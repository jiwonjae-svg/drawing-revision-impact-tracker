import { execFileSync } from "node:child_process";

export default function globalSetup() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath is required to seed the E2E database.");

  execFileSync(process.execPath, [npmCli, "run", "db:seed"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
