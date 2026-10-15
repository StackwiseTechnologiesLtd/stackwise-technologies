/** Auth for machine-local connector (no admin browser session). */
export function authorizeConnectorSecret(
  request: Request,
): boolean {
  const connectorSecret = process.env.GROWTH_CONNECTOR_SECRET;
  if (!connectorSecret || connectorSecret.length < 32) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }
  const token = header.slice("Bearer ".length).trim();
  if (token.length !== connectorSecret.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ connectorSecret.charCodeAt(i);
  }
  return mismatch === 0;
}
