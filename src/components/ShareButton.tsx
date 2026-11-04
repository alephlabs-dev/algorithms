import { CheckIcon, Link2Icon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Status = "idle" | "copied" | "failed";

/** Copies the current URL, which always holds the settings and the array's seed. */
export const ShareButton = ({ iconOnly = false }: { iconOnly?: boolean }) => {
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
      aria-label={iconOnly ? label : undefined}
      title="Copy a link to this exact array and settings"
    >
      {status === "copied" ? <CheckIcon className="text-primary" /> : <Link2Icon />}
      {!iconOnly && <span aria-live="polite">{label}</span>}
    </Button>
  );
};
