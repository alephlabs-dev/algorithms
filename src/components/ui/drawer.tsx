import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { localized } from "@/i18n";
import { cn } from "@/utils/cn";
import { CloseButton } from "./bottom-sheet";
import { SheetPagesContext, type SheetPages } from "./sheet-pages";
import { useSheets } from "./sheets";

const text = localized({
  en: { back: "Back" },
  es: { back: "Atrás" },
});

// Explicit prop types keep these exports nameable in declaration output.

/** A modal sheet. Opening it closes the non-modal one, so sheets never stack. */
const Drawer = ({
  shouldScaleBackground = true,
  onOpenChange,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    onOpenChange={(open) => {
      if (open) useSheets.getState().close();
      onOpenChange?.(open);
    }}
    {...props}
  />
);

const DrawerTrigger = (props: ComponentProps<typeof DrawerPrimitive.Trigger>) => (
  <DrawerPrimitive.Trigger {...props} />
);

const DrawerClose = (props: ComponentProps<typeof DrawerPrimitive.Close>) => (
  <DrawerPrimitive.Close {...props} />
);

const DrawerContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content>) => (
  <DrawerPrimitive.Portal>
    <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim" />
    <DrawerPrimitive.Content
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-3xl border border-edge bg-surface",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>
);

const DrawerTitle = ({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Title>) => (
  <DrawerPrimitive.Title
    className={cn("text-xl font-semibold leading-none", className)}
    {...props}
  />
);

/** The sheet's title (a ✕ beside it) over its content, which can slide to one page and back. */
const SheetBody = ({
  title,
  children,
  ...props
}: { title: ReactNode; children: ReactNode } & Omit<ComponentProps<"div">, "title">) => {
  const [page, setPage] = useState<SheetPages["page"]>(null);
  const [shown, setShown] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const from = useRef<HTMLElement | null>(null);

  // Back on the main page, focus returns to the field that opened the page.
  useEffect(() => {
    if (!shown) from.current?.focus({ preventScroll: true });
  }, [shown]);

  const pages: SheetPages = {
    page,
    shown,
    slot,
    open: (id, pageTitle, opener) => {
      from.current = opener;
      setPage((last) => ({ id, title: pageTitle, visit: (last?.visit ?? 0) + 1 }));
      setShown(true);
    },
    back: () => setShown(false),
  };
  const pane = "col-start-1 row-start-1 min-w-0 transition-transform duration-300 ease-out motion-reduce:transition-none";

  return (
    <div
      data-sheet-body
      {...props}
      className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 pt-2 pb-10 text-foreground"
    >
      <div className="flex items-center justify-between gap-4">
        {/* The sheet keeps its name while a page is on screen; the page shows its own title. */}
        <DrawerTitle className={cn("flex items-center gap-2 text-xl font-semibold", shown && "sr-only")}>
          {title}
        </DrawerTitle>
        {shown && (
          <button
            type="button"
            onClick={pages.back}
            className="tap-target relative -ml-2 flex h-11 shrink-0 items-center gap-0.5 rounded-full pl-1 pr-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeftIcon aria-hidden className="h-5 w-5" />
            {text.back}
          </button>
        )}
        <DrawerClose asChild>
          <CloseButton />
        </DrawerClose>
      </div>
      {/* Back and ✕ on the top row, the page's title under them: the biggest text on the page. */}
      {shown && page && <h3 className="-mt-2 text-xl font-semibold">{page.title}</h3>}
      <SheetPagesContext.Provider value={pages}>
        {/* Both pages share one cell, so the sheet is as tall as the taller one and doesn't jump. */}
        <div className="grid overflow-x-clip">
          <div inert={shown} className={cn(pane, "flex flex-col gap-4", shown && "-translate-x-full")}>
            {children}
          </div>
          <div ref={setSlot} inert={!shown} className={cn(pane, !shown && "invisible translate-x-full")} />
        </div>
      </SheetPagesContext.Provider>
    </div>
  );
};

/**
 * A modal sheet's content: its title with a ✕ beside it, then the content.
 * Long lists may scroll; a sheet of controls must fit (UX.md rule 14). A select
 * inside it slides the sheet to its list instead of opening another sheet.
 */
const DrawerSheet = ({
  title,
  children,
  ...props
}: { title: ReactNode; children: ReactNode } & Omit<ComponentProps<"div">, "title">) => (
  <DrawerContent aria-describedby={undefined}>
    {/* Inside the content, so a closed sheet opens on its main page again. */}
    <SheetBody title={title} {...props}>
      {children}
    </SheetBody>
  </DrawerContent>
);

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerSheet };
