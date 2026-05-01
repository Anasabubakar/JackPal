"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.2,
  });

  return (
    <motion.div
      style={{ scaleX, background: "var(--lp-amber)" }}
      className="fixed left-0 right-0 top-0 z-[80] h-[2px] origin-left"
    />
  );
}
