import { useEffect, type RefObject } from "react";
import { useElementSize } from "@/hooks/useElementSize";
import { useStore } from "@/store";

/**
 * On a phone, tells the store the single-view stage's shape (height over width), so grids
 * get as many rows as it holds and span its width, however much height the browser's bars leave.
 */
export const useReportStageAspect = (ref: RefObject<HTMLElement | null>) => {
  const { width, height } = useElementSize(ref);
  const phone = useStore((s) => s.isMobile);
  const setStageAspect = useStore((s) => s.setStageAspect);
  useEffect(() => {
    if (phone && width > 0 && height > 0) setStageAspect(height / width);
  }, [phone, width, height, setStageAspect]);
};
