import type { MouseEvent } from "react";
import { isDirectPostUrl } from "@/lib/growth/post-url";
import type { GrowthPlatform } from "@/lib/growth/types";

function articleLinkLabel(
  platform: GrowthPlatform | null | undefined,
  href: string,
): string {
  if (!isDirectPostUrl(platform, href)) {
    if (platform === "linkedin") return "View author on LinkedIn";
    if (platform === "x") return "View author on X";
    return "View author";
  }
  if (platform === "linkedin") return "View article on LinkedIn";
  if (platform === "x") return "View article on X";
  return "View article";
}

type GrowthArticleLinkProps = {
  href: string;
  platform?: GrowthPlatform | null;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function GrowthArticleLink({
  href,
  platform,
  className = "text-xs font-medium text-accent hover:underline",
  onClick,
}: GrowthArticleLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {articleLinkLabel(platform, href)}
    </a>
  );
}
