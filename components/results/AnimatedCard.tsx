"use client";

import { motion, useReducedMotion } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
}

export function AnimatedCard({ children, index }: AnimatedCardProps) {
  // Reduced motion: same staggered reveal, opacity only — no vertical travel.
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: index * 0.11,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
