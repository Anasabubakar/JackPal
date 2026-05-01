"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ease, dur } from "@/lib/motion";

export function FadeUp({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: dur.smooth, ease: ease.out }}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur.expressive, ease: ease.out }}
    >
      {children}
    </motion.div>
  );
}

export function SpringScale({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} transition={ease.spring}>
      {children}
    </motion.div>
  );
}
