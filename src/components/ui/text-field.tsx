import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { parseWholeNumber } from "./number";

/** A whole number from min to max, and what to say when the field holds something else. */
type WholeNumber = { min: number; max: number; message: string };

type TextFieldProps = Omit<
  ComponentProps<"input">,
  "type" | "inputMode" | "id" | "aria-describedby" | "aria-invalid" | "value" | "className"
> & {
  label: ReactNode;
  value: string;
  hint?: ReactNode;
  /** Shown under the field and linked to it. Wins over the field's own check. */
  error?: string | null;
  /** Makes it a number field: text with a numeric keypad, checked when the learner leaves it. */
  number?: WholeNumber;
  /** Controls beside the input (buttons acting on it), in the same row under the label. */
  end?: ReactNode;
  className?: string;
  inputClassName?: string;
};

/**
 * A text field (UX.md rule 12): a native <input> with its label above, an
 * optional hint and an error linked through aria-describedby. 16px text on
 * touch screens, so iOS doesn't zoom in on focus. Buttons that act on the
 * field go in `end`, so they line up with the input.
 */
export const TextField = ({
  label,
  hint,
  error,
  number,
  end,
  value,
  className,
  inputClassName,
  onBlur,
  onChange,
  ...props
}: TextFieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // Only check once the learner has left the field, not on every key.
  const [blurred, setBlurred] = useState(false);
  const ownError =
    number && blurred && value.trim() !== "" && parseWholeNumber(value, number.min, number.max) === null
      ? number.message
      : null;
  const shown = error ?? ownError;
  const describedBy = [hint && hintId, shown && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="px-1 text-xs leading-4 font-medium text-foreground/70">
        {label}
      </label>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <input
          {...props}
          id={id}
          type="text"
          inputMode={number ? "numeric" : undefined}
          value={value}
          aria-invalid={shown ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            if (ownError) setBlurred(false);
            onChange?.(event);
          }}
          onBlur={(event) => {
            setBlurred(true);
            onBlur?.(event);
          }}
          className={cn(
            "h-10 w-full min-w-11 flex-1 rounded-full border border-line/70 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary sm:px-4 pointer-coarse:h-11 pointer-coarse:text-base",
            shown && "border-foreground",
            inputClassName,
          )}
        />
        {end}
      </div>
      {/* Hint and error wrap to the field's width instead of widening it (contain-inline-size). */}
      {hint && (
        <p id={hintId} className="px-1 text-xs leading-4 text-pretty text-foreground/60 contain-inline-size">
          {hint}
        </p>
      )}
      {shown && (
        <p id={errorId} role="alert" className="px-1 text-xs leading-4 text-pretty text-foreground/80 contain-inline-size">
          {shown}
        </p>
      )}
    </div>
  );
};
