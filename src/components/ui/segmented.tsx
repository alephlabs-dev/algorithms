import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  /** Shown as a tooltip and used as the accessible name when the label is short. */
  title?: string;
  disabled?: boolean;
  /** Where the guided tour points at this option. */
  "data-tour"?: string;
};

type Props<T extends string | number> = {
  /** Accessible name of the group. */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Wrap into rows of this many options; defaults to one row. */
  columns?: number;
  /** Compact (36px) rows for pointer layouts; touch layouts keep 44px. */
  compact?: boolean;
  /** Never narrower than its labels on one line: what's around it gives way instead. */
  fit?: boolean;
  className?: string;
};

const perRowOf = (columns: number | undefined, count: number) => columns ?? count;

/**
 * Pick one of several options. The single control for every "one of" choice
 * (view, size, input, display mode). Behaves as a radio group: arrow keys move
 * the selection and only the selected option is in the tab order.
 */
export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
  columns,
  compact,
  fit,
  className,
}: Props<T>) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const rounded = perRowOf(columns, options.length) < options.length ? "rounded-xl" : "rounded-full";

  // One highlight that slides to the selected option, instead of each option
  // lighting up on its own. It snaps into place on first paint and on resize,
  // and only animates when the selection changes.
  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;
    if (!group || !indicator) return;
    const place = (animate: boolean) => {
      const selected = group.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
      indicator.dataset.animate = String(animate);
      if (!selected || selected.offsetWidth === 0) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`;
      indicator.style.width = `${selected.offsetWidth}px`;
      indicator.style.height = `${selected.offsetHeight}px`;
    };
    place(indicator.dataset.placed === "true");
    indicator.dataset.placed = "true";
    // Snap (no slide) when the control itself changes size, e.g. on window resize.
    let size = `${group.offsetWidth}x${group.offsetHeight}`;
    const observer = new ResizeObserver(() => {
      const next = `${group.offsetWidth}x${group.offsetHeight}`;
      if (next === size) return;
      size = next;
      place(false);
    });
    observer.observe(group);
    return () => observer.disconnect();
  }, [value]);
  const enabled = options.filter((o) => !o.disabled && !disabled);
  const perRow = perRowOf(columns, options.length);
  // When the last row isn't full, the last option stretches to fill it.
  const leftover = options.length % perRow;
  const lastSpan = leftover === 0 ? 1 : perRow - leftover + 1;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step || enabled.length === 0) return;
    event.preventDefault();
    const current = Math.max(0, enabled.findIndex((o) => o.value === value));
    const next = enabled[(current + step + enabled.length) % enabled.length];
    onChange(next.value);
    const index = options.indexOf(next);
    groupRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[index]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative grid gap-1 border border-edge bg-background/60 p-1",
        // A single row reads as a pill; wrapped rows as a rounded block.
        perRow < options.length ? "rounded-2xl" : "rounded-full",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${perRow}, ${fit ? "minmax(max-content, 1fr)" : "minmax(0, 1fr)"})` }}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 bg-foreground opacity-0 data-[animate=true]:transition-[transform,width,height] data-[animate=true]:duration-300 data-[animate=true]:ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none",
          rounded
        )}
      />
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.title}
            title={option.title}
            data-tour={option["data-tour"]}
            tabIndex={selected ? 0 : -1}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            style={index === options.length - 1 && lastSpan > 1 ? { gridColumn: `span ${lastSpan}` } : undefined}
            className={cn(
              "tap-target relative flex items-center justify-center gap-1.5 px-2 text-sm leading-tight text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&_svg]:size-4",
              compact ? "min-h-10 lg:min-h-9" : "min-h-10",
              fit && "whitespace-nowrap",
              rounded,
              "transition-colors duration-200",
              selected && "font-semibold text-background hover:bg-transparent hover:text-background"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
