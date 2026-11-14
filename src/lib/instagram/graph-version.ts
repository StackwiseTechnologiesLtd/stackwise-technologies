/** Meta Graph API version (Instagram + Facebook hosts). */
export function getInstagramGraphVersion(): string {
  return (
    process.env.META_GRAPH_API_VERSION?.trim() ||
    process.env.INSTAGRAM_GRAPH_API_VERSION?.trim() ||
    "v21.0"
  );
}