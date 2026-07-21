"use client";
import { useEffect, useState } from "react";

/** Live wall clock. Returns null on the server / first render (hydration-safe). */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only initial clock value; state starts null to avoid SSR mismatch
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
