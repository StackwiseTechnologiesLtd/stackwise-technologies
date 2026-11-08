import { mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

export const METADATA_PATH = path.join(
  homedir(),
  ".stackwise",
  "jev-accounts.json",
);
export const KEYCHAIN_SERVICE = "stackwise-jev-apply";

function childEnv() {
  return { ...process.env };
}

function keychainSet(account, password) {
  if (/[\x00-\x1f\x7f]/.test(password)) {
    throw new Error("Password contains characters Keychain cannot store");
  }
  const quoted = `"${password.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const r = spawnSync(
    "/usr/bin/security",
    ["-i"],
    {
      encoding: "utf8",
      input: `add-generic-password -U -s "${KEYCHAIN_SERVICE}" -a "${account}" -w ${quoted}\n`,
      env: childEnv(),
    },
  );
  if (r.status !== 0) {
    throw new Error(
      r.stderr?.trim() ||
        "Keychain store failed — allow terminal access to Keychain if prompted",
    );
  }
}

function keychainGet(account) {
  const r = spawnSync(
    "/usr/bin/security",
    [
      "find-generic-password",
      "-s",
      KEYCHAIN_SERVICE,
      "-a",
      account,
      "-w",
    ],
    { encoding: "utf8", env: childEnv() },
  );
  const value = (r.stdout ?? "").replace(/\n$/, "");
  if (r.status !== 0 || !value) return null;
  return value;
}

function keychainDelete(account) {
  spawnSync(
    "/usr/bin/security",
    [
      "delete-generic-password",
      "-s",
      KEYCHAIN_SERVICE,
      "-a",
      account,
    ],
    { encoding: "utf8", env: childEnv() },
  );
}

export function loadMetadata() {
  if (!existsSync(METADATA_PATH)) {
    return { version: 1, accounts: [] };
  }
  return JSON.parse(readFileSync(METADATA_PATH, "utf8"));
}

export function saveMetadata(data) {
  mkdirSync(path.dirname(METADATA_PATH), { recursive: true, mode: 0o700 });
  writeFileSync(METADATA_PATH, `${JSON.stringify(data, null, 2)}\n`, {
    mode: 0o600,
  });
  chmodSync(METADATA_PATH, 0o600);
}

export function slugId(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/** Workday-style password: upper, lower, digit, special, 16+ chars. */
export function generateWorkdayPassword(length = 18) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const pick = (set) => set[randomBytes(1)[0] % set.length];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < length) {
    chars.push(pick(all));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * @param {object} entry
 * @param {string} password — never written to jev-accounts.json
 */
export function upsertAccount(entry, password) {
  if (!entry.id || !entry.email || !password) {
    throw new Error("id, email, and password are required");
  }
  const keychainAccount = entry.keychainAccount || entry.id;
  keychainSet(keychainAccount, password);

  const data = loadMetadata();
  const accounts = data.accounts.filter((a) => a.id !== entry.id);
  const row = {
    id: entry.id,
    employer: entry.employer ?? entry.id,
    portal: entry.portal ?? "workday",
    signInUrl: entry.signInUrl ?? "",
    email: entry.email,
    keychainAccount,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: entry.status ?? "active",
    notes: entry.notes ?? "",
  };
  accounts.push(row);
  saveMetadata({ ...data, version: 1, accounts });
  return row;
}

export function listAccounts() {
  return loadMetadata().accounts;
}

export function getAccount(id) {
  const row = listAccounts().find((a) => a.id === id);
  if (!row) return null;
  const password = keychainGet(row.keychainAccount);
  return { ...row, password };
}

export function deleteAccount(id) {
  const data = loadMetadata();
  const row = data.accounts.find((a) => a.id === id);
  if (!row) return false;
  keychainDelete(row.keychainAccount);
  data.accounts = data.accounts.filter((a) => a.id !== id);
  saveMetadata(data);
  return true;
}

export function findBySignInUrl(url) {
  if (!url?.trim()) return null;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const accounts = listAccounts();
  return (
    accounts.find((a) => {
      if (!a.signInUrl) return false;
      try {
        return new URL(a.signInUrl).hostname.toLowerCase() === host;
      } catch {
        return false;
      }
    }) ?? null
  );
}
