import Mark from "@/components/Mark";
import { TWITTER_URL, type SiteCopy } from "@/lib/content";

export default function Footer({ copy }: { copy: SiteCopy["footer"] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <Mark className="size-6" gradientId="sw-mark-footer" />
          <span>
            {copy.tagline} · {year}
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted">
          <a href="#work" className="hover:text-foreground">
            {copy.work}
          </a>
          <a href="#faq" className="hover:text-foreground">
            {copy.faq}
          </a>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            {copy.twitter}
          </a>
        </div>
      </div>
    </footer>
  );
}
