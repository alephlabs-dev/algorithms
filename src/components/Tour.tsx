import { Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MUD_COST } from "@/pathfinding";
import { useStore, type Module, type Theme } from "@/store";
import { Button } from "./ui/button";

type Context = { theme: Theme; wide: boolean; phone: boolean };

type Step = {
  /** Matches `data-tour="…"` on the element to light up (the first visible one). */
  anchor: string;
  /** Where to point instead on phones, when the anchor lives in a sheet there. */
  phoneAnchor?: string;
  title: string;
  text: (context: Context) => ReactNode;
};

const colorNames: Record<Theme, { comparing: string; done: string }> = {
  dark: { comparing: "Purple", done: "green" },
  light: { comparing: "Orange", done: "teal" },
};

/** A dot in the bar's color, so the words match what's on screen. */
const Swatch = ({ className }: { className: string }) => (
  <span aria-hidden className={`mr-1 inline-block h-2.5 w-2.5 rounded-full align-[-1px] ${className}`} />
);

const sortingSteps: Step[] = [
  {
    anchor: "picker",
    title: "Pick an algorithm",
    text: () => "Nine of them, grouped by how well they cope with bigger arrays.",
  },
  {
    anchor: "bars",
    title: "The array",
    text: ({ theme }) => (
      <>
        Each bar is a number. <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} bars are being compared; <Swatch className="bg-primary" />
        {colorNames[theme].done} ones are already in their final place.
      </>
    ),
  },
  {
    anchor: "play",
    title: "Play it",
    text: ({ wide }) =>
      `Watch it sort, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
  },
  {
    anchor: "narration",
    title: "Follow each step",
    text: ({ wide }) =>
      wide
        ? "The code it's running, with the current line lit up, and what just happened in plain words."
        : "What just happened, in plain words. Tap it to see the code.",
  },
  {
    anchor: "speed",
    title: "Set the pace",
    text: () => "1× is tuned to the size of the array. Go slower to read along, or faster to see the big picture.",
  },
  {
    anchor: "settings",
    title: "Change the array",
    text: () => "How many items, how they start out (random, reversed, nearly sorted…), and bars or numbers.",
  },
  {
    anchor: "race",
    title: "Race them",
    text: () => "Run up to four algorithms on the same array, side by side, and see which one does the least work.",
  },
];

const pathSteps: Step[] = [
  {
    anchor: "picker",
    title: "Pick a search",
    text: () => "Five ways to get from start to target. Some find the shortest path, some just find one.",
  },
  {
    anchor: "bars",
    title: "The grid",
    text: () => (
      <>
        Get from the <Swatch className="bg-primary" />
        start to the <Swatch className="ml-1 bg-background ring-2 ring-foreground" />
        target. Drag across the grid to draw walls, and drag either one to move it.
      </>
    ),
  },
  {
    anchor: "tools",
    phoneAnchor: "settings",
    title: "Walls, mud and layouts",
    text: ({ phone }) =>
      `${phone ? "In settings: switch" : "Switch"} the brush to mud: it can be crossed, but each step on it costs ${MUD_COST}. Or start from a maze, random walls or rough terrain.`,
  },
  {
    anchor: "play",
    title: "Play it",
    text: ({ wide }) =>
      `Watch the search spread, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
  },
  {
    anchor: "narration",
    title: "Follow the search",
    text: ({ theme, wide }) => (
      <>
        <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} cells are waiting to be explored, faded ones are done, and the{" "}
        <Swatch className="bg-primary" />
        {colorNames[theme].done} line is the path.{" "}
        {wide ? "Here: the code it's running and what just happened." : "Tap here to see the code it's running."}
      </>
    ),
  },
  {
    anchor: "settings",
    title: "Change the grid",
    text: () => "A smaller grid to read along, or a bigger one to see how each search spreads.",
  },
];

const stepsFor: Record<Module, Step[]> = { sorting: sortingSteps, pathfinding: pathSteps };

const PAD = 8; // space between the element and the edge of the light
const GAP = 14; // space between the light and the bubble
const MARGIN = 12; // keeps the bubble off the window edges

const findAnchor = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].find((el) => el.getClientRects().length > 0);

/** Moves the light onto the step's element and puts the bubble where it fits best. */
const usePlacement = (anchor: string) => {
  const holeRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const hole = holeRef.current;
    const bubble = bubbleRef.current;
    if (!hole || !bubble) return;

    const place = () => {
      const el = findAnchor(anchor);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const b = bubble.getBoundingClientRect();
      if (!el) {
        hole.style.opacity = "0";
        bubble.style.transform = `translate(${(vw - b.width) / 2}px, ${(vh - b.height) / 2}px)`;
        return;
      }
      const r = el.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const box = { left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
      hole.style.opacity = "1";
      hole.style.transform = `translate(${box.left}px, ${box.top}px)`;
      hole.style.width = `${box.width}px`;
      hole.style.height = `${box.height}px`;
      hole.style.borderRadius = `${Math.min(radius + PAD, Math.min(box.width, box.height) / 2)}px`;

      // Below, else above, else beside, else inside the top of a large element (the bars).
      const centeredLeft = Math.min(Math.max(box.left + box.width / 2 - b.width / 2, MARGIN), vw - b.width - MARGIN);
      const clampTop = (top: number) => Math.min(Math.max(top, MARGIN), vh - b.height - MARGIN);
      let left = centeredLeft;
      let top: number;
      if (box.top + box.height + GAP + b.height <= vh - MARGIN) top = box.top + box.height + GAP;
      else if (box.top - GAP - b.height >= MARGIN) top = box.top - GAP - b.height;
      else if (box.left - GAP - b.width >= MARGIN) {
        left = box.left - GAP - b.width;
        top = clampTop(box.top);
      } else if (box.left + box.width + GAP + b.width <= vw - MARGIN) {
        left = box.left + box.width + GAP;
        top = clampTop(box.top);
      } else top = clampTop(box.top + GAP * 2);
      bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    };

    place();
    // Elements can shift (fonts loading, window resizing), so follow them.
    const interval = window.setInterval(place, 250);
    window.addEventListener("resize", place);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", place);
    };
  }, [anchor]);

  return { holeRef, bubbleRef };
};

const TourDialog = ({ steps }: { steps: Step[] }) => {
  const closeTour = useStore((s) => s.closeTour);
  const theme = useStore((s) => s.theme);
  const wide = useMediaQuery("(min-width: 1280px)");
  const keyboard = useMediaQuery("(min-width: 1024px)");
  const [index, setIndex] = useState(0);
  // Below the md breakpoint, where the grid tools move into the settings sheet.
  const phone = useMediaQuery("(max-width: 767px)");
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const { holeRef, bubbleRef } = usePlacement((phone && step.phoneAnchor) || step.anchor);
  const nextRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const next = () => (isLast ? closeTour() : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  // Keep keyboard focus in the bubble, on the main action.
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
      else if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeTour, steps.length]);

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Catches clicks so the page waits until the tour is over. */}
      <div className="absolute inset-0" />
      {/* The light: a cut-out whose huge shadow darkens everything else. */}
      <div
        ref={holeRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 shadow-[0_0_0_200vmax_rgb(0_0_0/0.65)] transition-[transform,width,height,border-radius] duration-500 ease-[cubic-bezier(0.3,1.1,0.4,1)] motion-reduce:transition-none [:root[data-theme=light]_&]:shadow-[0_0_0_200vmax_rgb(19_41_75/0.45)]"
      />
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute left-0 top-0 flex w-[min(22rem,calc(100vw-24px))] flex-col gap-3 rounded-3xl border border-edge bg-surface p-5 text-foreground shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.3,1.1,0.4,1)] motion-reduce:transition-none"
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-xs text-foreground/60">
              {index + 1} / {steps.length}
            </span>
            <h2 id={titleId} className="text-lg font-semibold leading-tight">
              {step.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 h-9 w-9"
            onClick={closeTour}
            aria-label="Close tour"
          >
            <Cross2Icon />
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          {step.text({ theme, phone, wide: step.anchor === "play" ? keyboard : wide })}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Progress dots: where you are in the tour. */}
          <div aria-hidden className="flex gap-1.5">
            {steps.map((s, k) => (
              <span
                key={s.anchor}
                className={
                  k === index
                    ? "h-1.5 w-4 rounded-full bg-foreground transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-line transition-all"
                }
              />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            )}
            <Button ref={nextRef} variant="primary" size="sm" className="px-4" onClick={next}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** A short guided tour: dims the page, lights up one control at a time and explains it. */
export const Tour = () => {
  const isOpen = useStore((s) => s.isTourOpen);
  const module = useStore((s) => s.module);
  // Keyed by module, so going Back to the other module mid-tour starts its own tour from the top.
  return isOpen ? <TourDialog key={module} steps={stepsFor[module]} /> : null;
};
