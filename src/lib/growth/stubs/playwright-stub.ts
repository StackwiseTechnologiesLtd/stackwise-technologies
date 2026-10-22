/** Replaces `playwright` during OpenNext Worker builds (Playwright cannot run on Workers). */

const unavailable = () => {
  throw new Error(
    "Playwright is not available in this deployment. Use npm run dev locally for browser automation.",
  );
};

export const chromium = {
  launch: unavailable,
};

export const firefox = { launch: unavailable };
export const webkit = { launch: unavailable };
