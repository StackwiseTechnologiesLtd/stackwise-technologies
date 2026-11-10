import fs from "node:fs";
import path from "node:path";
import { loadPlaywrightModule } from "@/lib/growth/playwright-loader";

const BRAVE =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const WORKSPACE_BROWSERS = path.join(
  process.cwd(),
  ".playwright-browsers",
);

function resolveChromeForTesting(): string | null {
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    WORKSPACE_BROWSERS,
    process.env.HOME
      ? path.join(process.env.HOME, "Library/Caches/ms-playwright")
      : null,
  ].filter((v): v is string => Boolean(v));

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    try {
      const entries = fs.readdirSync(root);
      for (const entry of entries) {
        if (!entry.startsWith("chromium-")) continue;
        const candidate = path.join(
          root,
          entry,
          "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        );
        if (fs.existsSync(candidate)) return candidate;
        const x64 = path.join(
          root,
          entry,
          "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        );
        if (fs.existsSync(x64)) return x64;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export type GrowthBrowserLaunchOptions = {
  headless?: boolean;
  slowMo?: number;
  args?: string[];
};

const DEFAULT_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-default-browser-check",
];

/** Prefer workspace Chromium, then Brave, then Playwright default. */
export async function launchGrowthChromium(
  options: GrowthBrowserLaunchOptions = {},
) {
  const { chromium } = await loadPlaywrightModule();
  const args = [
    "--disable-blink-features=AutomationControlled",
    ...(options.args ?? []),
  ];
  const base = {
    headless: options.headless ?? false,
    slowMo: options.slowMo,
    args,
  };

  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (envPath && fs.existsSync(envPath)) {
    return chromium.launch({ ...base, executablePath: envPath });
  }

  const chromeForTesting = resolveChromeForTesting();
  if (chromeForTesting) {
    return chromium.launch({ ...base, executablePath: chromeForTesting });
  }

  if (fs.existsSync(BRAVE)) {
    return chromium.launch({ ...base, executablePath: BRAVE });
  }

  return chromium.launch(base);
}
