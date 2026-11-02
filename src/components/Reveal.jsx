import React from "react";
import { motion, useReducedMotion } from "motion/react";

const elements = { div: motion.div, section: motion.section, article: motion.article };

/** Shared entrance motion; content stays in its original layout and reveals once. */
export function useReveal(direction = "up", delay = 0) {
    const reducedMotion = useReducedMotion();
    return {
        initial: reducedMotion ? false : "hidden",
        animate: reducedMotion ? "visible" : undefined,
        whileInView: "visible",
        viewport: { once: true, amount: 0.12 },
        variants: {
            hidden: { opacity: 0, x: direction === "left" ? -24 : direction === "right" ? 24 : 0,
                y: direction === "up" ? 26 : 0 },
            visible: { opacity: 1, x: 0, y: 0 },
        },
        transition: { duration: reducedMotion ? 0 : 0.58, delay: reducedMotion ? 0 : delay,
            ease: [0.22, 1, 0.36, 1] },
    };
}

export default function Reveal({ as = "div", direction = "up", delay = 0, children, ...props }) {
    const Element = elements[as] || motion.div;
    const reveal = useReveal(direction, delay);
    return <Element {...reveal} {...props}>{children}</Element>;
}
