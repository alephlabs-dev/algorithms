import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** A small (i) with an explanation on hover or keyboard focus. Pointer layouts only. */
export const InfoTip = ({ title, content }: { title: string; content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger aria-label={`About ${title}`} className="rounded-sm text-foreground/70 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
        <InfoCircledIcon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent className="flex w-72 flex-col gap-1 bg-accent p-3" side="right">
        <span className="text-sm font-semibold">{title}</span>
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
