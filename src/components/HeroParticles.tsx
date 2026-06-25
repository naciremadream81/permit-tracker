"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

const ITEMS = [
  { cls: "fp-approved", anim: "a", x: 7,  delay: "0s",   dur: "13s" },
  { cls: "fp-neutral",  anim: "b", x: 16, delay: "-8s",  dur: "16s" },
  { cls: "fp-review",   anim: "a", x: 28, delay: "-2s",  dur: "11s" },
  { cls: "fp-neutral",  anim: "b", x: 42, delay: "-5s",  dur: "14s" },
  { cls: "fp-review",   anim: "a", x: 57, delay: "-10s", dur: "12s" },
  { cls: "fp-warn",     anim: "b", x: 71, delay: "0s",   dur: "15s" },
  { cls: "fp-neutral",  anim: "a", x: 83, delay: "-4s",  dur: "13s" },
  { cls: "fp-neutral",  anim: "b", x: 21, delay: "-12s", dur: "17s" },
  { cls: "fp-neutral",  anim: "a", x: 63, delay: "-3s",  dur: "14s" },
  { cls: "fp-neutral",  anim: "b", x: 91, delay: "-7s",  dur: "12s" },
  { cls: "fp-neutral",  anim: "a", x: 37, delay: "-6s",  dur: "15s" },
  { cls: "fp-neutral",  anim: "b", x: 77, delay: "-2s",  dur: "13s" },
];

const SPRING = { stiffness: 55, damping: 22 };
const SHIFT = 28;

export function HeroParticles() {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  useEffect(() => {
    if (reduce) return;
    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.4;
      rawX.set(((e.clientX - cx) / cx) * SHIFT);
      rawY.set(((e.clientY - cy) / cy) * SHIFT * 0.5);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY, reduce]);

  return (
    <motion.div className="hero-particles" aria-hidden style={{ x, y }}>
      {ITEMS.map((item, i) => (
        <div
          key={i}
          className={`hero-particle hero-particle--${item.anim} ${item.cls}`}
          style={{
            left: `${item.x}%`,
            animationDelay: item.delay,
            animationDuration: item.dur,
          }}
        />
      ))}
    </motion.div>
  );
}
