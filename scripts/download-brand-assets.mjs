#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const destRoot = join(root, "public/branding/opsis");
const base = "https://branding.kargul.studio/assets/opsis";

const paths = [
  "brand-fonts.css",
  "opsis-introduction.avif",
  "opsis-introduction-800.avif",
  "opsis-introduction-1600.avif",
  "opsis-tram.avif",
  "opsis-tram-800.avif",
  "opsis-tram-1600.avif",
  "opsis-stationery.avif",
  "opsis-stationery-800.avif",
  "opsis-stationery-1600.avif",
  "opsis-posters.avif",
  "opsis-posters-800.avif",
  "opsis-posters-1600.avif",
  "opsis-materials.avif",
  "opsis-materials-800.avif",
  "opsis-materials-1600.avif",
  "opsis-flag.avif",
  "opsis-flag-800.avif",
  "opsis-flag-1600.avif",
  "opsis-linkedin-header.avif",
  "opsis-linkedin-header-800.avif",
  "opsis-linkedin-header-1600.avif",
  "opsis-introduction.png",
  "preview-fonts/Exposure-0.ttf",
  "exports/applications/opsis-introduction.avif",
  "exports/applications/opsis-introduction.png",
  "exports/applications/opsis-tram.avif",
  "exports/applications/opsis-tram.png",
  "exports/applications/opsis-stationery.avif",
  "exports/applications/opsis-stationery.png",
  "exports/applications/opsis-posters.avif",
  "exports/applications/opsis-posters.png",
  "exports/applications/opsis-materials.avif",
  "exports/applications/opsis-materials.png",
  "exports/applications/opsis-flag.avif",
  "exports/applications/opsis-flag.png",
  "exports/applications/opsis-linkedin-header.avif",
  "exports/applications/opsis-linkedin-header.png",
  "exports/applications/opsis-linkedin-header-personal.avif",
  "exports/applications/opsis-linkedin-header-personal.png",
  "exports/isotype/opsis-isotype-green.svg",
  "exports/isotype/opsis-isotype-brown.svg",
  "exports/isotype/opsis-isotype-paper.svg",
  "exports/isotype/opsis-isotype-black.svg",
  "exports/isotype/opsis-isotype-white.svg",
  "exports/logotype/opsis-logotype-green.svg",
  "exports/logotype/opsis-logotype-brown.svg",
  "exports/logotype/opsis-logotype-paper.svg",
  "exports/logotype/opsis-logotype-black.svg",
  "exports/logotype/opsis-logotype-white.svg",
  "exports/profile-pictures/opsis-pfp-on-green.svg",
  "exports/profile-pictures/opsis-pfp-on-brown.svg",
  "exports/profile-pictures/opsis-pfp-on-paper.svg",
  "exports/profile-pictures/opsis-pfp-on-black.svg",
  "exports/profile-pictures/opsis-pfp-on-white.svg",
  "exports/app-icons/svg/opsis-favicon.svg",
  "exports/app-icons/png/opsis-favicon-32.png",
  "exports/app-icons/png/opsis-apple-touch.png",
  "exports/app-icons/png/opsis-icon-192.png",
  "exports/app-icons/png/opsis-icon-512.png",
  "exports/app-icons/ico/favicon.ico",
];

for (const rel of paths) {
  const url = `${base}/${rel}`;
  const out = join(destRoot, rel);
  await mkdir(dirname(out), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${res.status} ${rel}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log(`ok ${rel} (${buf.length})`);
}
