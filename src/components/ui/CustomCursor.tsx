"use client";

import { useEffect, useRef } from "react";
import { Plane } from "lucide-react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const icon = iconRef.current;
    if (!cursor || !icon) return;

    import("gsap").then((gsapModule) => {
      const gsap = gsapModule.default;

      // Set initial rotation so it looks like it's flying upwards to the right
      gsap.set(icon, { rotation: 45 });

      const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

      const onMouseMove = (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
      };

      const onMouseEnter = () => {
        // Expand circle and rotate the plane
        gsap.to(cursor, { 
          scale: 1.8, 
          backgroundColor: "rgba(14, 165, 233, 0.2)", 
          duration: 0.4, 
          ease: "back.out(1.5)" 
        });
        gsap.to(icon, { 
          rotation: 90, 
          scale: 0.8,
          opacity: 0.8,
          duration: 0.4, 
          ease: "power3.out" 
        });
      };

      const onMouseLeave = () => {
        // Shrink circle and rotate back
        gsap.to(cursor, { 
          scale: 1, 
          backgroundColor: "rgba(14, 165, 233, 0.05)", 
          duration: 0.3, 
          ease: "power3.out" 
        });
        gsap.to(icon, { 
          rotation: 45, 
          scale: 1,
          opacity: 0.5,
          duration: 0.3, 
          ease: "power3.out" 
        });
      };

      window.addEventListener("mousemove", onMouseMove);

      const addListeners = () => {
        const interactiveElements = document.querySelectorAll("a, button, input, textarea, .hover-target");
        interactiveElements.forEach((el) => {
          el.removeEventListener("mouseenter", onMouseEnter);
          el.removeEventListener("mouseleave", onMouseLeave);
          el.addEventListener("mouseenter", onMouseEnter);
          el.addEventListener("mouseleave", onMouseLeave);
        });
      };

      addListeners();

      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) shouldUpdate = true;
        });
        if (shouldUpdate) addListeners();
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        const interactiveElements = document.querySelectorAll("a, button, input, textarea, .hover-target");
        interactiveElements.forEach((el) => {
          el.removeEventListener("mouseenter", onMouseEnter);
          el.removeEventListener("mouseleave", onMouseLeave);
        });
        observer.disconnect();
      };
    });
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor flex items-center justify-center pointer-events-none z-50 transition-colors">
      <Plane ref={iconRef} className="cursor-icon text-brand w-6 h-6 opacity-50" strokeWidth={1.5} fill="none" />
    </div>
  );
}
