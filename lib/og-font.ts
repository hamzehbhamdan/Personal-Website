import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Playfair Display 700, bundled at assets/playfair-700.ttf and read from disk at
// build time. The OG-image routes are `force-static`, so they prerender during
// `next build`; reading the font locally avoids a build-time Google Fonts fetch —
// that fetch failed in GitHub Actions CI ("No fonts are loaded. At least one font
// is required to calculate the layout."), breaking the Pages export.
let cached: Buffer | null = null;

export async function loadPlayfair(): Promise<Buffer> {
  if (!cached) {
    cached = await readFile(join(process.cwd(), "assets", "playfair-700.ttf"));
  }
  return cached;
}
