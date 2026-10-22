export function isDevConnectRuntimeEnabled(): boolean {
  if (process.env.GROWTH_CONNECT_FORCE_LOCAL === "1") return true;
  return process.env.NODE_ENV === "development";
}
