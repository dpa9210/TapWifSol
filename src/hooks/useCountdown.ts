import { useEffect, useRef, useState } from "react";

/**
 * Ticks a countdown down to zero once per second while `active` is true,
 * calling `onExpire` exactly once when it hits zero. Resets to
 * `totalSeconds` whenever `totalSeconds` or `active` changes, so callers can
 * just flip `active` on/off around a request rather than managing a timer.
 */
export function useCountdown(
  totalSeconds: number,
  active: boolean,
  onExpire?: () => void
): number {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    if (!active) return;

    const start = Date.now();
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        totalSeconds - Math.floor((Date.now() - start) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [totalSeconds, active]);

  return secondsLeft;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
