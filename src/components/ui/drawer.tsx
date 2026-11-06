import type { ComponentProps, ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/utils/cn";
import { CloseButton } from "./bottom-sheet";
import { useSheets } from "./sheets";

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

/** A modal sheet's content: its title with a ✕ beside it, then what scrolls. */
const DrawerSheet = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <DrawerContent aria-describedby={undefined}>
    <div className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 pt-2 pb-10 text-foreground">
      <div className="flex items-center justify-between gap-4">
        <DrawerTitle className="flex items-center gap-2 text-xl font-semibold">{title}</DrawerTitle>
        <DrawerClose asChild>
          <CloseButton />
        </DrawerClose>
      </div>
      {children}
    </div>
  </DrawerContent>
);

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerSheet };
