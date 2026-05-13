import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ScriptLoader from "@/components/ScriptLoader";
import "../styles/globals.css";
import "../styles/main.css";
import "../styles/app.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stackwise Technologies Limited",
  description: "Engineering Scalable Software for Modern Businesses",
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: `/favicon.svg`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="nk-body">
        <ScriptLoader />
        <div className="nk-app-root has-mask">
          <div className="bg-mask-wraper">
            <div className="bg-mask bg-glow-a"></div>
            <div className="bg-pattern-grid blend-left-right-bottom bg-mask has-meteors h-800px"></div>
          </div>
          {/* import header */}
          {children}
          {/* import footer */}
        </div>
      </body>
    </html>
  );
}
