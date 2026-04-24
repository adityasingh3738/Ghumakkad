"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const destinations = [
  {
    id: 1,
    title: "The Himalayas",
    description: "Majestic peaks, serene monasteries, and thrilling treks.",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Pristine Beaches",
    description: "Sun-kissed sands and azure waters of the Indian coast.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "North East India",
    description: "Living root bridges, lush valleys, and rich cultures.",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "South India",
    description: "Tranquil backwaters, ancient temples, and lush hill stations.",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2070&auto=format&fit=crop",
  },
];

export function DestinationGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("gsap").then((gsapModule) => {
      const gsap = gsapModule.default;
      const { ScrollTrigger } = require("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>(".gallery-panel");

        if (window.innerWidth > 768) {
          gsap.to(panels, {
            xPercent: -100 * (panels.length - 1),
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              pin: true,
              scrub: 1,
              snap: 1 / (panels.length - 1),
              end: () => "+=" + (containerRef.current?.offsetWidth || 0),
            },
          });
        } else {
          // Mobile animation (fade in on scroll)
          panels.forEach((panel) => {
            gsap.fromTo(
              panel,
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                scrollTrigger: {
                  trigger: panel,
                  start: "top 80%",
                },
              }
            );
          });
        }
      }, sectionRef);

      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-dark text-white overflow-hidden py-20 md:py-0 md:h-screen flex items-center">
      <div className="absolute top-10 left-10 z-10 md:block hidden">
        <h2 className="text-4xl font-bold tracking-tighter">Breathtaking<br/><span className="text-brand">Destinations</span></h2>
      </div>
      
      <div 
        ref={containerRef} 
        className="flex flex-col md:flex-row w-full h-full md:w-[400vw]"
      >
        {destinations.map((dest, i) => (
          <div 
            key={dest.id} 
            className="gallery-panel relative w-full md:w-screen h-[50vh] md:h-full flex items-center justify-center p-8 md:p-20 flex-shrink-0"
          >
            <div className="relative w-full h-full max-w-5xl rounded-3xl overflow-hidden group">
              <Image
                src={dest.image}
                alt={dest.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 max-w-lg">
                <h3 className="text-3xl md:text-6xl font-bold mb-4">{dest.title}</h3>
                <p className="text-slate-300 text-lg md:text-xl font-sans">{dest.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
