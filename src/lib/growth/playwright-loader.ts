/** Dynamic import path esbuild must not statically resolve (Workers never ship Playwright). */
export async function loadPlaywrightModule() {
  const pkg = "playwright";
  return import(pkg);
}
