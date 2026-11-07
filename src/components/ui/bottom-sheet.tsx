import { Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useId, useRef, type ComponentProps, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/utils/cn";
import { localized } from "@/i18n";
import { Button } from "./button";
import { useSheets, type SheetId } from "./sheets";

const text = localized({
  en: { close: "Close" },
  es: { close: "Cerrar" },
});

// A drag down the handle further than this closes the sheet.
const SWIPE_CLOSE_PX = 60;

/** Lets the sheet be dragged down by its top edge, and closes it past a threshold. */
const useSwipeDown = (close: () => void) => {
  const sheetRef = useRef<HTMLElement>(null);
  const startY = useRef<number | null>(null);

  const offset = (y: number) => Math.max(0, y - (startY.current ?? y));
  const move = (dy: number) => {
    if (sheetRef.current) sheetRef.current.style.transform = dy ? `translateY(${dy}px)` : "";
  };

  return {
    sheetRef,
    handle: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        // The ✕ is a button, not part of the handle.
        if ((event.target as Element).closest("button")) return;
        startY.current = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (startY.current !== null) move(offset(event.clientY));
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        const dy = offset(event.clientY);
        startY.current = null;
        move(0);
        if (dy > SWIPE_CLOSE_PX) close();
      },
      onPointerCancel: () => {
        startY.current = null;
        move(0);
      },
    },
  };
};

/**
 * A non-modal bottom sheet (UX.md rule 8): no backdrop, at most half the
 * screen, and part of the page's layout, so the stage shrinks to stay whole
 * above it and keeps playing. Closes with its ✕, a swipe down, Escape or its button.
 */
export const BottomSheet = ({
  id,
  title,
  icon,
  className,
  children,
}: {
  id: SheetId;
  title: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) => {
  const close = useSheets((s) => s.close);
  const titleId = useId();
  const { sheetRef, handle } = useSwipeDown(close);

  // Focus moves into the sheet, so the keyboard lands on its settings.
  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });
  }, [sheetRef]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <section
      ref={sheetRef}
      id={`sheet-${id}`}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn(
        "-mx-4 -mb-4 flex max-h-[50dvh] shrink-0 flex-col rounded-t-3xl border border-b-0 border-edge bg-surface text-foreground shadow-(--shadow-dock) focus-visible:outline-hidden md:-mx-6 md:-mb-6 lg:-mx-8",
        className
      )}
    >
      {/* The top edge is the handle: drag it down to close. */}
      <div {...handle} className="flex shrink-0 touch-none flex-col gap-1 px-6 pt-3">
        <div aria-hidden className="mx-auto h-1.5 w-12 rounded-full bg-line" />
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="flex items-center gap-2 text-xl font-semibold">
            {icon}
            {title}
          </h2>
          <CloseButton onClick={close} />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pt-2 pb-8">{children}</div>
    </section>
  );
};

/** The ✕ every sheet has in its top corner. */
export const CloseButton = ({ className, ...props }: ComponentProps<typeof Button>) => (
  <Button variant="ghost" size="icon" aria-label={text.close} {...props} className={cn("-mr-3 shrink-0", className)}>
    <Cross2Icon />
  </Button>
);
