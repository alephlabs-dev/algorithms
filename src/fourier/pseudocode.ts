import type { FourierAlgorithm } from "./types";

const wave = (radius: string, which: string) => [
  "for each frame, θ from 0 to two turns:",
  "  point = the center",
  `  for each n in ${which}:`,
  `    r = ${radius}`,
  "    point += r · (cos nθ, sin nθ)",
  "    draw a circle of radius r around the last point",
  "  plot the point's height on the wave",
];

export const fourierPseudocode: Record<FourierAlgorithm, string[]> = {
  square: wave("4 / (n·π)", "1, 3, 5, … (N circles)"),
  sawtooth: wave("2 / (n·π), flipped for even n", "1, 2, 3, … (N circles)"),
  triangle: wave("8 / (n·π)², flipped every other one", "1, 3, 5, … (N circles)"),
  epicycles: [
    "sample the drawing at 256 points z[j]",
    "for each speed k: c[k] = average of z[j] · e^(−2πi·k·j/256)",
    "keep the N biggest circles |c[k]|",
    "for each frame, θ from 0 to one turn:",
    "  tip = the center",
    "  for each kept circle k: tip += c[k] · e^(i·k·θ)",
    "  draw the path of the tip",
  ],
};
