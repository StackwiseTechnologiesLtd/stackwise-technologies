/** Standard asset paths for a DB-backed brand (upload slots in admin). */
export function standardBrandAssetPaths(slug: string): { path: string; label: string }[] {
  const p = (segment: string, label: string) => ({
    path: segment,
    label,
  });
  return [
    p("brand-fonts.css", "Web fonts CSS"),
    p(`exports/logotype/${slug}-logotype-primary.svg`, "Logotype (dark)"),
    p(`exports/logotype/${slug}-logotype-white.svg`, "Logotype (white)"),
    p(`exports/isotype/${slug}-isotype-primary.svg`, "Isotype (color)"),
    p(`exports/isotype/${slug}-isotype-white.svg`, "Isotype (white)"),
    p(`exports/isotype/${slug}-isotype-black.svg`, "Isotype (black)"),
    p(`exports/app-icons/svg/${slug}-favicon.svg`, "Favicon SVG"),
    p(`${slug}-introduction.avif`, "Introduction hero (AVIF)"),
    p(`${slug}-introduction-800.avif`, "Introduction hero 800w"),
    p(`${slug}-introduction-1600.avif`, "Introduction hero 1600w"),
    p(`${slug}-linkedin-header.avif`, "LinkedIn header (AVIF)"),
    p(`${slug}-linkedin-header-800.avif`, "LinkedIn header 800w"),
    p(`${slug}-linkedin-header-1600.avif`, "LinkedIn header 1600w"),
    p(`exports/applications/${slug}-linkedin-header.png`, "LinkedIn header PNG export"),
    p("preview-fonts/display.ttf", "Display font file"),
  ];
}
