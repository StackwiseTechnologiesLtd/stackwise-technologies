import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "@/styles/brand-guidelines/kargul-base.css";
import "@/styles/brand-guidelines/kargul-modules.css";
import "@/styles/brand-guidelines/stackwise-shell.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const themeScript = `
(function () {
  try {
    var key = "brand-guidelines-theme";
    var stored = localStorage.getItem(key);
    var dark = stored !== "light";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function BrandingLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`brand-guidelines-root ${geistSans.variable}`}
      data-theme="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#111112" />
      </head>
      <body>{children}</body>
    </html>
  );
}
