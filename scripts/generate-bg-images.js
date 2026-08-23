// Generate premium gradient background images for 知途 PPT
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = "E:\\Q1.1\\output\\bg";
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;  // 16:9

function createGradientBuffer(stops) {
  // Create SVG with linear gradient
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        ${stops.map((s, i) => `<stop offset="${s.pos}%" stop-color="${s.color}" />`).join("\n        ")}
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)" />
  </svg>`;
  return Buffer.from(svg);
}

async function make(name, stops) {
  await sharp(createGradientBuffer(stops)).png().toFile(path.join(OUT, name));
  console.log(`✅ ${name}`);
}

(async () => {

// 1. Cover - deep charcoal with warm ray
await make("01_cover.png", [
  { pos: 0, color: "#0d0d0d" },
  { pos: 40, color: "#141414" },
  { pos: 65, color: "#1a1a18" },
  { pos: 100, color: "#1a1814" },
]);

// 2. Dark section divider
await make("02_section_dark.png", [
  { pos: 0, color: "#0a0a0a" },
  { pos: 50, color: "#111111" },
  { pos: 100, color: "#0f0f0f" },
]);

// 3. Light content slide - warm off-white
await make("03_content_light.png", [
  { pos: 0, color: "#fafaf8" },
  { pos: 100, color: "#f5f4f0" },
]);

// 4. Dark content slide - navy gradient
await make("04_content_navy.png", [
  { pos: 0, color: "#0f1119" },
  { pos: 50, color: "#151720" },
  { pos: 100, color: "#0d0f16" },
]);

// 5. Accent - warm gold glow (right side)
await make("05_accent_gold.png", [
  { pos: 0, color: "#111111" },
  { pos: 80, color: "#151410" },
  { pos: 100, color: "#1a1710" },
]);

// 6. Pure black for title areas
await make("06_pure_black.png", [
  { pos: 0, color: "#080808" },
  { pos: 100, color: "#0a0a0a" },
]);

console.log("\n✅ All backgrounds generated in", OUT);

})();
