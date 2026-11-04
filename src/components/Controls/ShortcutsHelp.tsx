import { KeyboardIcon } from "@radix-ui/react-icons";
import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { Button } from "../ui/button";

const shortcuts: [keys: string[], action: string][] = [
  [["Space"], "Play or pause"],
  [["←", "→"], "Step back or forward"],
  [["R"], "New array"],
  [["?"], "Show this help"],
];

/** Keyboard shortcuts in a native modal dialog (focus trap and Esc come for free). */
export const ShortcutsHelp = () => {
  const isOpen = useStore((s) => s.isHelpOpen);
  const setOpen = useStore((s) => s.setHelpOpen);
  const resetHints = useStore((s) => s.resetHints);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <>
      {/* Keyboards are rare on touch screens, so the button only shows on wide layouts. */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        aria-label="Keyboard shortcuts"
        aria-keyshortcuts="Shift+/"
        title="Keyboard shortcuts (?)"
        onClick={() => setOpen(true)}
      >
        <KeyboardIcon />
      </Button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => event.target === dialogRef.current && setOpen(false)}
        className="m-auto w-full max-w-sm rounded-3xl border border-edge bg-surface p-6 text-foreground shadow-xl backdrop:bg-black/60"
      >
        <h2 className="mb-4 text-xl font-semibold">Keyboard shortcuts</h2>
        <dl className="flex flex-col gap-3 text-sm">
          {shortcuts.map(([keys, action]) => (
            <div key={action} className="flex items-center justify-between gap-4">
              <dt className="text-foreground/80">{action}</dt>
              <dd className="flex gap-1">
                {keys.map((key) => (
                  <kbd key={key} className="min-w-7 rounded-md border border-line px-1.5 py-0.5 text-center font-mono text-xs">
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <form method="dialog" className="mt-6 flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={resetHints} title="Show the first-visit tips again">
            Show tips again
          </Button>
          <Button size="sm">Close</Button>
        </form>
      </dialog>
    </>
  );
};
