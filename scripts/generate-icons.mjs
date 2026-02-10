import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");
const svgPath = join(root, "public", "icon.svg");

mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

// Maskable icons: content scaled to 80% with emerald padding
const maskableSizes = [
  { name: "icon-maskable-192x192.png", size: 192 },
  { name: "icon-maskable-512x512.png", size: 512 },
];

async function generate() {
  // Standard icons
  for (const { name, size } of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(join(outDir, name));
    console.log(`  ${name}`);
  }

  // Maskable icons (content at 80%, centered on emerald bg)
  for (const { name, size } of maskableSizes) {
    const innerSize = Math.round(size * 0.7);
    const inner = await sharp(svgPath)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 5, g: 150, b: 105, alpha: 1 }, // #059669
      },
    })
      .composite([
        {
          input: inner,
          left: Math.round((size - innerSize) / 2),
          top: Math.round((size - innerSize) / 2),
        },
      ])
      .png()
      .toFile(join(outDir, name));
    console.log(`  ${name} (maskable)`);
  }

  console.log("\nDone! Icons generated in public/icons/");
}

generate().catch(console.error);
