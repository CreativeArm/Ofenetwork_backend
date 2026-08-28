"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  mode?: "load" | "scroll";
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

function buildMotionStyle(delay = 0, distance = 24): CSSProperties {
  return {
    animationDelay: `${delay}s`,
    "--motion-distance": `${distance}px`,
  } as CSSProperties & Record<"--motion-distance", string>;
}

function useMotionVisible(mode: "load" | "scroll" = "scroll") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (mode === "load" || typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  return { ref, isVisible };
}

export function Reveal({
  children,
  delay = 0,
  distance = 24,
  className,
  mode = "scroll",
}: RevealProps) {
  const { ref, isVisible } = useMotionVisible(mode);

  return (
    <div
      ref={ref}
      className={["motion-reveal", isVisible ? "motion-visible" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={buildMotionStyle(delay, distance)}
    >
      {children}
    </div>
  );
}

export function Stagger({ children, className }: StaggerProps) {
  return <div className={["min-w-0", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const { ref, isVisible } = useMotionVisible("scroll");

  return (
    <div
      ref={ref}
      className={["motion-stagger-item min-w-0", isVisible ? "motion-visible" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
