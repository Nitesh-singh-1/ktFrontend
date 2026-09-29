"use client";

import { RefObject, useEffect } from "react";

/**
 * TASK-014 slice 1 — a11y foundations.
 *
 * Traps keyboard focus inside a modal container while it is open, so:
 *   - Tab / Shift+Tab cycle only through focusable elements INSIDE the modal,
 *     never off into the underlying page.
 *   - The first focusable element inside the modal receives focus on mount
 *     (typically the close button or first input), so keyboard users don't
 *     start on `document.body`.
 *   - When the modal unmounts / closes, focus is restored to the element that
 *     was focused when the modal opened (the button that triggered it).
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(ref, isOpen);
 *   return <div ref={ref} role="dialog" aria-modal="true">...</div>;
 *
 * Pass `enabled=false` while the modal is closed so we don't do work / steal
 * focus for a hidden container.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    const node = container.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusables = (): HTMLElement[] => {
      // Standard focusable selector set. Filters out disabled + tabindex="-1"
      // so we don't stop on programmatically-focused-only elements.
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("hidden") && el.offsetParent !== null,
      );
    };

    // Focus the first focusable element in the modal on mount. If there isn't
    // one (rare but possible for a message-only modal), fall back to the
    // container itself so Tab still stays inside.
    const initialFocusables = getFocusables();
    if (initialFocusables.length > 0) {
      initialFocusables[0].focus();
    } else if (node.tabIndex < 0) {
      node.tabIndex = -1;
      node.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger element so keyboard users don't lose their
      // place when the modal closes.
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [container, enabled]);
}
