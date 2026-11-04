import { useEffect, useRef, useState } from "react";

/**
 * Follows `value`, but changes at most once per `interval` ms, always ending on
 * the latest value. Slow changes (stepping by hand) still come through at once.
 */
export const useThrottled = <T>(value: T, interval: number): T => {
  const [shown, setShown] = useState(value);
  const lastShownAt = useRef(0);

  useEffect(() => {
    const wait = Math.max(0, lastShownAt.current + interval - performance.now());
    const timeout = window.setTimeout(() => {
      lastShownAt.current = performance.now();
      setShown(value);
    }, wait);
    return () => window.clearTimeout(timeout);
  }, [value, interval]);

  return shown;
};
