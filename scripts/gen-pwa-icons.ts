/**
 * One-off PWA icon generator.
 *
 * Renders the lucide GraduationCap (white stroke) on an AWS-Compute-Orange
 * square into the PNG sizes a PWA manifest needs. Uses `next/og`'s
 * ImageResponse (bundled with Next 16, powered by satori/resvg) so we add NO
 * new dependency. sharp is only a fallback if satori ever fails to rasterize
 * the SVG — do not install it preemptively.
 *
 * Run: pnpm tsx scripts/gen-pwa-icons.ts
 */
import { ImageResponse } from "next/og";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import { BRAND_ORANGE } from "../src/lib/brand";

// lucide-react v1.16.0 graduation-cap, 24x24 viewBox, stroke-based.
const GRAD_CAP_PATHS = [
  "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
  "M22 10v6",
  "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
];

const PUBLIC_DIR = join(process.cwd(), "public");

/**
 * Build a full-bleed SVG: orange background with the white graduation cap
 * centered.
 *
 * @param size           target pixel size
 * @param glyphFraction  cap size as a fraction of the canvas
 * @param cornerRadius   background corner radius in px (0 = square / full-bleed)
 */
function buildSvg(size: number, glyphFraction: number, cornerRadius: number): string {
  const target = size * glyphFraction;
  const scale = target / 24; // lucide glyph is authored in a 24-unit box
  const offset = (size - target) / 2;
  const radius = Math.round(cornerRadius);

  const paths = GRAD_CAP_PATHS.map((d) => `<path d="${d}" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BRAND_ORANGE}" />
  <g transform="translate(${offset} ${offset}) scale(${scale})"
     fill="none" stroke="#ffffff" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
    ${paths}
  </g>
</svg>`;
}

async function renderPng(size: number, glyphFraction: number, cornerRadius: number): Promise<Buffer> {
  const svg = buildSvg(size, glyphFraction, cornerRadius);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  const element = React.createElement("img", {
    src: dataUri,
    width: size,
    height: size,
  });

  const res = new ImageResponse(element, { width: size, height: size });
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  // glyph fractions: maskable conservative (~0.5) to clear Android's
  // 80%-diameter safe zone; `any` larger (~0.62). Apple is full-bleed (square,
  // no transparency) so iOS doesn't paint black behind transparent corners.
  const ROUNDED = 0.62;
  const MASKABLE = 0.5;
  const targets: Array<{ file: string; size: number; glyph: number; radius: number; note?: string }> = [
    { file: "icon-192.png", size: 192, glyph: ROUNDED, radius: 192 * 0.22 },
    { file: "icon-512.png", size: 512, glyph: ROUNDED, radius: 512 * 0.22 },
    { file: "icon-maskable.png", size: 512, glyph: MASKABLE, radius: 0, note: "maskable" },
    { file: "apple-icon-180.png", size: 180, glyph: ROUNDED, radius: 0, note: "apple full-bleed" },
  ];

  for (const { file, size, glyph, radius, note } of targets) {
    const png = await renderPng(size, glyph, radius);
    await writeFile(join(PUBLIC_DIR, file), png);
    console.log(`wrote public/${file} (${size}x${size}${note ? `, ${note}` : ""}) — ${png.length} bytes`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
