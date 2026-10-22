import { spawnSync } from "node:child_process";

const useWebpack = process.env.OPENNEXT_CLOUDFLARE_BUILD === "1";
const args = ["next", "build", ...(useWebpack ? ["--webpack"] : ["--turbo"])];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
