import type { FourierAlgorithm, FourierShape } from "@/fourier";

type SeriesDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** The series in one line. */
  formula: string;
  /** What each circle's speed is, in a few words. */
  speeds: string;
};

// Key order is the order shown in the UI.
export const fourierSeries: Record<FourierAlgorithm, SeriesDetails> = {
  square: {
    title: "Square Wave",
    short: "Square",
    shortDescription:
      "Odd sines, each smaller than the last, stacked as circles. Their sum flattens into a square wave, with a little overshoot at every jump that never goes away.",
    longDescription:
      "A square wave jumps between +1 and −1. Fourier showed it can be built from sines alone: the sines at 1, 3, 5, 7… times the base frequency, with sizes 4/π, 4/(3π), 4/(5π)… Draw each sine as a circle turning at its speed on the tip of the one before, and the height of the last tip traces the sum. One circle gives a plain sine; a few more square off the top and bottom. Right at each jump the sum overshoots by about 9%, however many circles you add: the Gibbs phenomenon, the price of building a jump out of smooth waves.",
    formula: "(4/π) · Σ sin(nθ)/n, for n = 1, 3, 5, …",
    speeds: "odd speeds: 1, 3, 5…",
  },
  sawtooth: {
    title: "Sawtooth Wave",
    short: "Sawtooth",
    shortDescription:
      "Every whole-number sine, alternating in sign and shrinking as 1/n. Their sum climbs steadily, then drops: a sawtooth.",
    longDescription:
      "A sawtooth wave rises in a straight line and drops back at once, like the teeth of a saw. It needs every harmonic, odd and even: sines at 1, 2, 3… times the base frequency with sizes 2/π, 2/(2π), 2/(3π)…, every other one flipped. As circles, the even ones turn the opposite way to start. Few circles give a wobbly ramp; more give a straighter climb and a sharper drop, with the same overshoot as the square wave at the jump. Synthesizers build sounds this way, adding harmonics to a sine.",
    formula: "(2/π) · Σ (−1)ⁿ⁺¹ sin(nθ)/n, for n = 1, 2, 3, …",
    speeds: "every speed: 1, 2, 3…",
  },
  triangle: {
    title: "Triangle Wave",
    short: "Triangle",
    shortDescription:
      "Odd sines again, but shrinking as 1/n², so they fade fast. A handful of circles already give a near-perfect triangle.",
    longDescription:
      "A triangle wave goes up and down in straight lines, with corners but no jumps. Its series uses the same odd harmonics as the square wave, but their sizes fall as 1/n² instead of 1/n (8/π², 8/(9π²), 8/(25π²)…), alternating in sign. Because the circles shrink so quickly, three or four already trace it closely, and there's no overshoot: smoother shapes need fewer circles. That's the rule behind compressing sound and images: smooth signals can be kept with few terms.",
    formula: "(8/π²) · Σ (−1)ᵏ sin(nθ)/n², for n = 2k + 1",
    speeds: "odd speeds: 1, 3, 5…",
  },
  epicycles: {
    title: "Fourier Epicycles",
    short: "Epicycles",
    shortDescription:
      "Any closed drawing can be traced by circles on circles. The discrete Fourier transform finds them; the biggest carry the shape, the small ones the detail.",
    longDescription:
      "Take a closed drawing and walk along it at an even pace: your position is a point in the plane that comes back where it started. The discrete Fourier transform rewrites that path as a sum of circles, each turning a whole number of times per lap (some clockwise, some anticlockwise), with its own size and starting angle. Chain them tip to tip and the last tip retraces the drawing. Sorted by size, the first few circles give the rough shape and the rest add detail; with as many circles as points sampled, the drawing comes back exactly. The naive transform takes O(N²) steps; the fast Fourier transform does it in O(N log N).",
    formula: "c[k] = (1/N) · Σ z[j] · e^(−2πi·k·j/N)",
    speeds: "every speed, both ways",
  },
};

export type ShapeOption = { value: FourierShape; label: string; title: string };

/** The drawings to pick from, in groups. */
export const shapeGroups: { label: string; shapes: ShapeOption[] }[] = [
  {
    label: "Shapes",
    shapes: [
      { value: "heart", label: "Heart", title: "A smooth curve: few circles do" },
      { value: "star", label: "Star", title: "Sharp points need more circles" },
      { value: "infinity", label: "Infinity", title: "A figure eight that crosses itself" },
      { value: "square", label: "Square", title: "Corners: watch the circles round them off" },
    ],
  },
  {
    label: "Sky",
    shapes: [
      { value: "crux", label: "Southern Cross", title: "Crux: four bright stars, the southern sky's compass" },
      { value: "orion", label: "Orion", title: "The hunter, with his belt of three stars" },
      { value: "dipper", label: "Big Dipper", title: "The saucepan in the Great Bear" },
      { value: "cassiopeia", label: "Cassiopeia", title: "The W of the queen" },
    ],
  },
  {
    label: "Drawings",
    shapes: [
      { value: "aleph", label: "Aleph", title: "ℵ, as in Aleph Labs" },
      { value: "butterfly", label: "Butterfly", title: "Temple Fay's butterfly curve" },
      { value: "fish", label: "Fish", title: "The fish curve" },
      { value: "cat", label: "Cat", title: "A cat's head, ears and all" },
      { value: "note", label: "Note", title: "A musical note" },
      { value: "bolt", label: "Lightning", title: "A lightning bolt: all corners" },
    ],
  },
];

export const shapeOptions: ShapeOption[] = [
  ...shapeGroups.flatMap((g) => g.shapes),
  { value: "custom", label: "Draw your own", title: "Draw your own shape in one stroke" },
];

export const shapeLabel = (shape: FourierShape) =>
  shape === "custom" ? "Your drawing" : shapeOptions.find((s) => s.value === shape)!.label;
