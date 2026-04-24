"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function MagneticButton({ children, className, ...props }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const text = textRef.current;
    if (!button || !text) return;

    import("gsap").then((gsapModule) => {
      const gsap = gsapModule.default;

      const xTo = gsap.quickTo(button, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
      const yTo = gsap.quickTo(button, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

      const xTextTo = gsap.quickTo(text, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
      const yTextTo = gsap.quickTo(text, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = button.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);

        xTo(x * 0.4);
        yTo(y * 0.4);

        xTextTo(x * 0.2);
        yTextTo(y * 0.2);
      };

      const handleMouseLeave = () => {
        xTo(0);
        yTo(0);
        xTextTo(0);
        yTextTo(0);
      };

      button.addEventListener("mousemove", handleMouseMove);
      button.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        button.removeEventListener("mousemove", handleMouseMove);
        button.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, []);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full bg-brand px-8 py-4 font-medium text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
        className
      )}
      {...props}
    >
      <div ref={textRef} className="pointer-events-none relative z-10 flex items-center gap-2">
        {children}
      </div>
      {/* Ripple or hover background effect can go here if needed */}
    </button>
  );
}
