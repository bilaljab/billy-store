'use client';
import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

interface MotionGateProps {
  /** Rendered when the user has no motion preference restriction. */
  children: ReactNode;
  /** Rendered instead when prefers-reduced-motion is set. */
  fallback: ReactNode;
}

/** Gates a motion-primitives effect behind prefers-reduced-motion (WCAG 2.3.3). */
export default function MotionGate({ children, fallback }: MotionGateProps) {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? <>{fallback}</> : <>{children}</>;
}
