import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { parseWholeNumber } from "./number";

/** Lines up a control beside a TextField (in a row with items-start) with its input: the label's 16px and the 4px gap. */
export const besideField = "mt-5";

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
  className?: string;
  inputClassName?: string;
};

/**
 * A text field (UX.md rule 12): a native <input> with its label above, an
 * optional hint and an error linked through aria-describedby. 16px text on
 * touch screens, so iOS doesn't zoom in on focus.
 */
export const TextField = ({
  label,
  hint,
  error,
  number,
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
          "h-10 w-full min-w-11 rounded-full border border-line/70 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary sm:px-4 pointer-coarse:h-11 pointer-coarse:text-base",
          shown && "border-foreground",
          inputClassName,
        )}
      />
      {/* The hint goes under the input, so controls beside the field line up the same with or without one. */}
      {hint && (
        <p id={hintId} className="px-1 text-xs leading-4 text-pretty text-foreground/60">
          {hint}
        </p>
      )}
      {shown && (
        <p id={errorId} role="alert" className="px-1 text-xs leading-4 text-pretty text-foreground/80">
          {shown}
        </p>
      )}
    </div>
  );
};
