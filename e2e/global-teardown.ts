import { execSync } from "node:child_process";

export default function globalTeardown() {
  execSync("npm run db:seed", {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: "powershell.exe",
  });
}

