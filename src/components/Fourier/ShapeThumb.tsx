import { shapeData, type FourierShape } from "@/fourier";
import { cn } from "@/utils/cn";

// Thumbnails are the drawings themselves, worked out once per shape.
const cache = new Map<FourierShape, { line: string; stars: { x: number; y: number }[] }>();
const geometry = (shape: FourierShape) => {
  if (!cache.has(shape)) {
    const { points, stars } = shapeData(shape, null);
    cache.set(shape, { line: points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" "), stars });
  }
  return cache.get(shape)!;
};

/** A drawing in miniature, in the text color; a hand-drawn one is a pencil. */
export const ShapeThumb = ({ shape, className }: { shape: FourierShape; className?: string }) => {
  if (shape === "custom") {
    return (
      <svg
        aria-hidden
        viewBox="-1.2 -1.2 2.4 2.4"
        className={cn("h-8 w-8", className)}
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M-0.8 0.8 L-0.6 0.3 L0.4 -0.7 L0.7 -0.4 L-0.3 0.6 Z M0.2 -0.5 L0.5 -0.2"
          strokeWidth="0.12"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const { line, stars } = geometry(shape);
  return (
    <svg aria-hidden viewBox="-1.2 -1.2 2.4 2.4" className={cn("h-8 w-8", className)}>
      <polygon points={line} fill="none" stroke="currentColor" strokeWidth={0.09} strokeLinejoin="round" />
      {stars.map((star, k) => (
        <circle key={k} cx={star.x} cy={star.y} r={0.13} fill="currentColor" />
      ))}
    </svg>
  );
};
