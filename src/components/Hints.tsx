import { Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { HINTS, selectLastIndex, useStore, type HintId } from "@/store";

type Hint = { text: string; placement: "top" | "bottom" };

/**
 * First-visit tips. Each one points at an element marked `data-hint="<id>"`
 * (the first visible one, since phone and desktop layouts render their own).
 */
const content: Record<HintId | "narrationCompact", Hint> = {
  play: { text: "Press play to watch it sort, or step through it one move at a time with →.", placement: "top" },
  narration: { text: "Every step is explained here in plain words, next to the line of code it runs.", placement: "bottom" },
  // Below xl the code isn't on screen: the sentence opens it.
  narrationCompact: { text: "Every step is explained here in plain words. Tap it to see the code.", placement: "bottom" },
  speed: { text: "Too fast or too slow? Change the pace here. 1× adapts to the size of the array.", placement: "top" },
  picker: { text: "Sorted! Try another algorithm on the same array and compare.", placement: "bottom" },
};

// The speed tip waits until playback has run for a while.
const SPEED_HINT_DELAY_MS = 4000;
// A tip on screen this long counts as read, even if it then goes away on its own.
const READ_AFTER_MS = 2000;
const GAP = 12;
const MARGIN = 12;

/** Which tip, if any, fits what the person is doing right now. */
const useCurrentHint = (): HintId | null => {
  const { seen, isSingle, started, isPlaying, finished, dismissHint } = useStore(
    useShallow((s) => ({
      seen: s.seenHints,
      isSingle: s.view === "single",
      started: s.frameIndex > 0,
      isPlaying: s.isPlaying,
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      dismissHint: s.dismissHint,
    }))
  );

  // Starting a run is what the play tip asks for, so it's done once anything starts.
  useEffect(() => {
    if (started || isPlaying) dismissHint("play");
  }, [started, isPlaying, dismissHint]);

  const [playedLong, setPlayedLong] = useState(false);
  useEffect(() => {
    if (!isPlaying) return;
    const timeout = window.setTimeout(() => setPlayedLong(true), SPEED_HINT_DELAY_MS);
    return () => {
      window.clearTimeout(timeout);
      setPlayedLong(false);
    };
  }, [isPlaying]);

  if (!isSingle) return null;
  const applies: Record<HintId, boolean> = {
    play: !started && !isPlaying,
    narration: started && !isPlaying && !finished,
    speed: isPlaying && playedLong,
    picker: finished && !isPlaying,
  };
  return HINTS.find((id) => !seen.includes(id) && applies[id]) ?? null;
};

/** Places the bubble next to its anchor, and keeps it there as the layout changes. */
const useAnchoredPosition = (id: HintId, placement: Hint["placement"]) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const arrow = arrowRef.current;
    if (!bubble || !arrow) return;

    const place = () => {
      const anchor = [...document.querySelectorAll<HTMLElement>(`[data-hint="${id}"]`)].find(
        (el) => el.getClientRects().length > 0
      );
      if (!anchor) {
        bubble.style.visibility = "hidden";
        return;
      }
      const a = anchor.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      const center = a.left + a.width / 2;
      const left = Math.min(Math.max(center - b.width / 2, MARGIN), window.innerWidth - b.width - MARGIN);
      const top = placement === "top" ? a.top - b.height - GAP : a.bottom + GAP;
      bubble.style.visibility = "visible";
      bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      arrow.style.left = `${Math.round(Math.min(Math.max(center - left, 20), b.width - 20))}px`;
    };

    place();
    // Anchors move with layout (fonts loading, panels opening), so re-check now and then.
    const interval = window.setInterval(place, 250);
    window.addEventListener("resize", place);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", place);
    };
  }, [id, placement]);

  return { bubbleRef, arrowRef };
};

const HintBubble = ({ id }: { id: HintId }) => {
  const dismissHint = useStore((s) => s.dismissHint);
  const wide = useMediaQuery("(min-width: 1280px)");
  const { text, placement } = content[id === "narration" && !wide ? "narrationCompact" : id];
  const { bubbleRef, arrowRef } = useAnchoredPosition(id, placement);

  // Once read, a tip doesn't come back every time its moment does (each pause, each run).
  useEffect(() => {
    const shownAt = performance.now();
    return () => {
      if (performance.now() - shownAt >= READ_AFTER_MS) dismissHint(id);
    };
  }, [id, dismissHint]);

  return (
    <div
      ref={bubbleRef}
      role="status"
      style={{ visibility: "hidden" }}
      className="fixed left-0 top-0 z-40 w-[min(20rem,calc(100vw-24px))]"
    >
      <div className="relative flex items-start gap-3 rounded-2xl bg-foreground py-3 pl-4 pr-2 text-sm text-background shadow-2xl animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
        <span
          ref={arrowRef}
          aria-hidden
          className={
            placement === "top"
              ? "absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-foreground"
              : "absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-foreground"
          }
        />
        <p className="flex-1 leading-snug">{text}</p>
        <button
          type="button"
          onClick={() => dismissHint(id)}
          aria-label="Dismiss tip"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-background/70 hover:bg-background/15 hover:text-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Cross2Icon />
        </button>
      </div>
    </div>
  );
};

/** Shows at most one tip at a time; each appears once, when it's relevant. */
export const Hints = () => {
  const current = useCurrentHint();
  // Remount per tip so each one animates in at its own anchor.
  return current ? <HintBubble key={current} id={current} /> : null;
};
