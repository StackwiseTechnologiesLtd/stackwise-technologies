#!/usr/bin/env node
/**
 * Employer portal logins for Cursor browser apply (passwords in macOS Keychain).
 *
 *   npm run growth:jev:accounts:list
 *   npm run growth:jev:accounts:gen-password
 *   JEV_ACCOUNT_PASSWORD='…' npm run growth:jev:accounts:save -- --id workday:petronascanada ...
 *   npm run growth:jev:accounts:show -- workday:petronascanada   # local only; prints password
 *
 * Metadata: ~/.stackwise/jev-accounts.json (mode 600). Never commit passwords.
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import {
  deleteAccount,
  findBySignInUrl,
  generateWorkdayPassword,
  getAccount,
  listAccounts,
  slugId,
  upsertAccount,
  METADATA_PATH,
} from "./lib/jev-employer-accounts.mjs";

loadEnvLocal();

const [cmd, ...rest] = process.argv.slice(2);

function readArg(name) {
  const eq = rest.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const i = rest.indexOf(`--${name}`);
  if (i !== -1 && rest[i + 1] && !rest[i + 1].startsWith("--")) return rest[i + 1];
  return "";
}

function usage() {
  console.log(`Employer accounts — metadata at ${METADATA_PATH}

Commands:
  list
  gen-password [--length=18]
  save --id <id> --email <email> [--employer ...] [--portal workday] [--url ...] [--notes ...]
       (password: JEV_ACCOUNT_PASSWORD env, or first non-flag arg)
  show <id>              print password (local use only)
  delete <id>
  match --url <sign-in-url>   metadata row for hostname

Examples:
  npm run growth:jev:accounts:gen-password
  JEV_ACCOUNT_PASSWORD="$(npm run -s growth:jev:accounts:gen-password)" \\
    npm run growth:jev:accounts:save -- --id workday:petronascanada \\
    --employer "PETRONAS Canada" \\
    --email you@example.com \\
    --url "https://petronascanada.wd3.myworkdayjobs.com/..."
`);
}

if (!cmd || cmd === "help" || cmd === "-h") {
  usage();
  process.exit(0);
}

try {
  if (cmd === "list") {
    const accounts = listAccounts();
    if (!accounts.length) {
      console.log("No saved employer accounts.");
      process.exit(0);
    }
    for (const a of accounts) {
      console.log(`${a.id}  ${a.employer}  ${a.portal}  ${a.email}`);
      if (a.signInUrl) console.log(`  ${a.signInUrl}`);
    }
    process.exit(0);
  }

  if (cmd === "gen-password") {
    const len = Number.parseInt(readArg("length") || "18", 10);
    console.log(generateWorkdayPassword(Number.isFinite(len) ? len : 18));
    process.exit(0);
  }

  if (cmd === "save") {
    const id =
      readArg("id") ||
      `${readArg("portal") || "workday"}:${slugId(readArg("employer") || "employer")}`;
    const email = readArg("email");
    const password =
      process.env.JEV_ACCOUNT_PASSWORD?.trim() ||
      rest.find((a) => !a.startsWith("--")) ||
      "";
    if (!email || !password) {
      console.error("Need --email and JEV_ACCOUNT_PASSWORD (or password as trailing arg).");
      process.exit(1);
    }
    const row = upsertAccount(
      {
        id,
        email,
        employer: readArg("employer") || id,
        portal: readArg("portal") || "workday",
        signInUrl: readArg("url"),
        notes: readArg("notes"),
      },
      password,
    );
    console.log("Saved", row.id, "→ Keychain +", METADATA_PATH);
    process.exit(0);
  }

  if (cmd === "show") {
    const id = rest[0] || readArg("id");
    if (!id) {
      console.error("Usage: show <id>");
      process.exit(1);
    }
    const acct = getAccount(id);
    if (!acct?.password) {
      console.error("Unknown account or no Keychain entry:", id);
      process.exit(1);
    }
    console.log(acct.password);
    process.exit(0);
  }

  if (cmd === "delete") {
    const id = rest[0] || readArg("id");
    if (!id || !deleteAccount(id)) {
      console.error("Not found:", id);
      process.exit(1);
    }
    console.log("Deleted", id);
    process.exit(0);
  }

  if (cmd === "match") {
    const url = readArg("url");
    const row = findBySignInUrl(url);
    if (!row) {
      console.log("No saved account for that host.");
      process.exit(1);
    }
    console.log(JSON.stringify(row, null, 2));
    process.exit(0);
  }

  console.error("Unknown command:", cmd);
  usage();
  process.exit(1);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
