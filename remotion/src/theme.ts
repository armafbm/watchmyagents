// Matches WatchMyAgents brand tokens (src/styles.css)
export const C = {
  bg: "#0a0e1f",
  bg2: "#131a36",
  bg3: "#1b2347",
  card: "#161d3d",
  border: "#2a3360",
  fg: "#f1f5f9",
  muted: "#8b94b8",
  primary: "#4dc4f5", // electric cyan
  primaryDim: "#2b8fbf",
  accent: "#7c5cff", // indigo
  accentDim: "#4a36b8",
  danger: "#ff5a4d",
  warn: "#f5a524",
  success: "#4ade80",
  gradient: "linear-gradient(135deg, #4dc4f5 0%, #7c5cff 100%)",
  gradientSoft: "linear-gradient(135deg, rgba(77,196,245,0.15) 0%, rgba(124,92,255,0.15) 100%)",
};

import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const display = loadDisplay("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const body = loadBody("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const F = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
};
