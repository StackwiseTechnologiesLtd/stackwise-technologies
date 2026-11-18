import type { Page } from "playwright";

export const GROWTH_APPLICANT = {
  name: "Daniel Tshikomba",
  email: "tshikombadaniel@gmail.com",
  phone: process.env.JEV_PHONE?.trim() || "",
  linkedin: process.env.JEV_LINKEDIN_URL?.trim() || "",
};

/** Open a job posting and prefill common fields; leaves submit to the user when headed. */
export async function prefillAtsApplyPage(
  page: Page,
  applyUrl: string,
  coverNote?: string,
): Promise<void> {
  await page.goto(applyUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(2500);

  const email = page.locator('input[type="email"], input[name*="email" i]').first();
  if (await email.isVisible({ timeout: 3000 }).catch(() => false)) {
    await email.fill(GROWTH_APPLICANT.email);
  }
  const name = page
    .locator(
      'input[name*="name" i], input[autocomplete="name"], input[placeholder*="name" i]',
    )
    .first();
  if (await name.isVisible({ timeout: 2000 }).catch(() => false)) {
    await name.fill(GROWTH_APPLICANT.name);
  }
  const phone = page.locator('input[type="tel"], input[name*="phone" i]').first();
  if (
    GROWTH_APPLICANT.phone &&
    (await phone.isVisible({ timeout: 1500 }).catch(() => false))
  ) {
    await phone.fill(GROWTH_APPLICANT.phone);
  }

  if (coverNote?.trim()) {
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill(coverNote.slice(0, 2000));
    }
  }
}