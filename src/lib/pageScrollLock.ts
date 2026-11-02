import { useLayoutEffect } from "react";

let locks = 0;
let original: { overflow: string; gutter: string; padding: string } | null = null;

/** Reserve the existing layout width with padding while unlocking the root
 * gutter, so top-layer backdrops can paint all the way to the viewport edge.
 * A shared counter keeps nested native and Radix dialogs from unlocking early.
 */
function acquire() {
    const root = document.documentElement;
    if (locks++ === 0) {
        original = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter, padding: root.style.paddingRight };
        const gap = Math.max(0, window.innerWidth - root.getBoundingClientRect().width);
        const padding = Number.parseFloat(getComputedStyle(root).paddingRight) || 0;
        root.style.paddingRight = `${padding + gap}px`;
        root.style.scrollbarGutter = "auto";
        root.style.overflow = "hidden";
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        if (--locks === 0 && original) {
            root.style.overflow = original.overflow;
            root.style.scrollbarGutter = original.gutter;
            root.style.paddingRight = original.padding;
            original = null;
        }
    };
}

export function usePageScrollLock(enabled = true) {
    useLayoutEffect(() => { if (enabled) return acquire(); }, [enabled]);
}

// Mount inside portalled Radix content, whose lifetime follows the open dialog.
export function PageScrollLock() { usePageScrollLock(); return null; }
