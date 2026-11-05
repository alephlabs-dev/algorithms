import { KeyboardIcon } from "@radix-ui/react-icons";
import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { Button } from "../ui/button";
import { localized } from "@/i18n";

const text = localized({
  en: {
    space: "Space",
    playPause: "Play or pause",
    step: "Step back or forward",
    newArray: "New array",
    help: "Show this help",
    title: "Keyboard shortcuts",
    titleHint: "Keyboard shortcuts (?)",
    tour: "Take the tour",
    close: "Close",
  },
  es: {
    space: "Espacio",
    playPause: "Reproducir o pausar",
    step: "Paso atrás o adelante",
    newArray: "Nuevo arreglo",
    help: "Mostrar esta ayuda",
    title: "Atajos de teclado",
    titleHint: "Atajos de teclado (?)",
    tour: "Hacer el recorrido",
    close: "Cerrar",
  },
});

const shortcuts: [keys: string[], action: string][] = [
  [[text.space], text.playPause],
  [["←", "→"], text.step],
  [["R"], text.newArray],
  [["?"], text.help],
];

/** Keyboard shortcuts in a native modal dialog (focus trap and Esc come for free). */
export const ShortcutsHelp = () => {
  const isOpen = useStore((s) => s.isHelpOpen);
  const setOpen = useStore((s) => s.setHelpOpen);
  const openTour = useStore((s) => s.openTour);
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
        aria-label={text.title}
        aria-keyshortcuts="Shift+/"
        title={text.titleHint}
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
        <h2 className="mb-4 text-xl font-semibold">{text.title}</h2>
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
          <Button variant="ghost" size="sm" onClick={openTour}>
            {text.tour}
          </Button>
          <Button size="sm">{text.close}</Button>
        </form>
      </dialog>
    </>
  );
};
