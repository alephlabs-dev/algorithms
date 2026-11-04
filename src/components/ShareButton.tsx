import { CheckIcon, Link2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Status = "idle" | "copied" | "failed";

/** Copies the current URL, which always holds the settings and the array's seed. */
export const ShareButton = ({
  iconOnly = false,
  labelClassName,
}: {
  iconOnly?: boolean;
  /** Lets a layout hide the text at some widths (it stays the accessible name). */
  labelClassName?: string;
}) => {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  const label =
    status === "copied" ? "Link copied" : status === "failed" ? "Copy from the address bar" : "Copy link";

  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      onClick={copy}
      aria-label={iconOnly || labelClassName ? label : undefined}
      title="Copy a link to this exact array and settings"
    >
      {status === "copied" ? <CheckIcon className="text-primary" /> : <Link2Icon />}
      {!iconOnly && (
        <span aria-live="polite" className={labelClassName}>
          {label}
        </span>
      )}
    </Button>
  );
};
