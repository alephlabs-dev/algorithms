import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  // The focus ring uses the brand green so keyboard focus is visible on the dark background.
  "tap-target relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** The one main action in a group (Play). Light fill, dark text. */
        primary: "bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-[background-color,transform] motion-reduce:active:scale-100",
        /** Everything else that's a button: an outlined pill. */
        secondary: "border border-line/70 bg-transparent text-foreground hover:bg-accent",
        /** Low-emphasis actions inside surfaces. */
        ghost: "text-foreground hover:bg-accent",
      },
      size: {
        /** 44px: comfortable to tap. */
        default: "h-11 px-4",
        sm: "h-9 px-3",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};

export { Button };
