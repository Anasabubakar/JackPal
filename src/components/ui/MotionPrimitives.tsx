'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ease, dur } from '@/lib/motion';

export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: dur.smooth, ease: ease.out, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  direction = 'right',
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  className?: string;
}) {
  const x = direction === 'right' ? 16 : -16;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x }}
      transition={ease.spring}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SpringScale({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={ease.spring}
      className={className}
    >
      {children}
    </motion.div>
  );
}