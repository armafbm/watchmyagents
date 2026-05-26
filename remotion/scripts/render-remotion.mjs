import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const out = process.argv[2] || "/mnt/documents/wma-demo.mp4";
const frameRange = process.argv[3]; // optional "0-300"

console.log("Bundling…");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Launching browser…");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

console.log(`Composition: ${composition.durationInFrames} frames @ ${composition.fps}fps -> ${composition.durationInFrames / composition.fps}s`);

let frameRangeParsed = undefined;
if (frameRange) {
  const [a, b] = frameRange.split("-").map((n) => parseInt(n, 10));
  frameRangeParsed = [a, b];
  console.log(`Rendering frames ${a}..${b}`);
}

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: out,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  frameRange: frameRangeParsed,
  onProgress: ({ progress }) => {
    process.stdout.write(`\rRendering ${(progress * 100).toFixed(1)}%   `);
  },
});

await browser.close({ silent: false });
console.log(`\n✓ Done -> ${out}`);
