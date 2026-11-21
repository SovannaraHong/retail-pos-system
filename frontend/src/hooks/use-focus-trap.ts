import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab / Shift+Tab inside `ref` while `active`, moves focus in on open,
 * and gives focus back to whatever had it before when the overlay closes.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active = true,
) {
  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;

    const previous = document.activeElement as HTMLElement | null;

    if (!root.contains(document.activeElement)) {
      (root.querySelector<HTMLElement>(FOCUSABLE) ?? root).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const items = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);

      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [ref, active]);
}
