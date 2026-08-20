import Mark from "@/components/Mark";
import { SITE_NAME, TWITTER_URL } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <Mark className="size-6" gradientId="sw-mark-footer" />
          <span>
            {SITE_NAME} · {year}
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted">
          <a href="#work" className="hover:text-foreground">
            Work
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
