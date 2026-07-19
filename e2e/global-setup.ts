import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npm run db:seed", {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: "powershell.exe",
  });
}
