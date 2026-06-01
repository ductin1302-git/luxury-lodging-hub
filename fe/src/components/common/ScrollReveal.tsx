import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type RevealDirection = "up" | "left" | "right" | "scale" | "zoom-in" | "blur" | "slide-up";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number; // stagger index (1-6)
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const directionClassMap: Record<RevealDirection, string> = {
  up: "scroll-reveal",
  left: "scroll-reveal-left",
  right: "scroll-reveal-right",
  scale: "scroll-reveal-scale",
  "zoom-in": "scroll-reveal-zoom-in",
  blur: "scroll-reveal-blur",
  "slide-up": "scroll-reveal-slide-up",
};

/**
 * A wrapper component that reveals its children with animation
 * when they scroll into the viewport.
 */
const ScrollReveal = ({
  children,
  direction = "up",
  delay,
  className = "",
  threshold = 0.1,
  triggerOnce = false, // Changed to false to allow reset on scroll up
}: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollReveal({ threshold, triggerOnce });
  const baseClass = directionClassMap[direction];
  const staggerClass = delay ? `stagger-${delay}` : "";

  return (
    <div
      ref={ref}
      className={`${baseClass} ${staggerClass} ${isVisible ? "visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
