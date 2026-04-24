"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { MagneticButton } from "./ui/MagneticButton";
import { ArrowDown } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("gsap").then((gsapModule) => {
      const gsap = gsapModule.default;
      const { ScrollTrigger } = require("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Entrance animation
        gsap.fromTo(
          textRef.current?.children ? Array.from(textRef.current.children) : [],
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power4.out", delay: 0.2 }
        );

        gsap.fromTo(
          imageRef.current,
          { scale: 1.1, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.5, ease: "power3.out" }
        );

        // Parallax effect on scroll
        gsap.to(imageRef.current, {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, containerRef);

      return () => ctx.revert();
    });
  }, []);

  const scrollToGenerator = () => {
    const generatorSection = document.getElementById("generator");
    if (generatorSection) {
      generatorSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div ref={imageRef} className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop" // Himalayas
          alt="Himalayas landscape"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>



      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto" ref={textRef}>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
          India on a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-300">Budget</span>
        </h1>
        <p className="text-lg md:text-2xl text-slate-200 mb-10 max-w-2xl font-sans">
          Discover the majestic Himalayas, pristine beaches, and hidden gems of the North East without breaking the bank.
        </p>
        <MagneticButton onClick={scrollToGenerator} className="text-lg px-10 py-5">
          Plan Your Trip <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
        </MagneticButton>
      </div>
    </section>
  );
}
