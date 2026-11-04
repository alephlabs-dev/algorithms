import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  /** Shown as a tooltip and used as the accessible name when the label is short. */
  title?: string;
  disabled?: boolean;
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
  className?: string;
};

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
  className,
}: Props<T>) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const enabled = options.filter((o) => !o.disabled && !disabled);
  const perRow = columns ?? options.length;
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
        "grid gap-1 border border-edge bg-background/60 p-1",
        // A single row reads as a pill; wrapped rows as a rounded block.
        perRow < options.length ? "rounded-2xl" : "rounded-full",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
    >
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
            tabIndex={selected ? 0 : -1}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            style={index === options.length - 1 && lastSpan > 1 ? { gridColumn: `span ${lastSpan}` } : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2 text-sm leading-tight text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&_svg]:size-4",
              compact ? "min-h-10 lg:min-h-9" : "min-h-10",
              perRow < options.length ? "rounded-xl" : "rounded-full",
              selected && "bg-foreground font-semibold text-background hover:bg-foreground hover:text-background"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
