export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  in: [0.64, 0, 0.78, 0] as [number, number, number, number],
  spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 300, damping: 20 },
  springStiff: { type: 'spring' as const, stiffness: 600, damping: 40 },
};

export const dur = {
  instant: 0.12,
  quick: 0.22,
  smooth: 0.35,
  expressive: 0.55,
};