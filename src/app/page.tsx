import { Hero } from "@/components/Hero";
import { DestinationGallery } from "@/components/DestinationGallery";
import { ItineraryGenerator } from "@/components/ItineraryGenerator";
import { CustomCursor } from "@/components/ui/CustomCursor";

export default function Home() {
  return (
    <main className="min-h-screen relative w-full bg-light">
      <CustomCursor />
      <Hero />
      <DestinationGallery />
      <ItineraryGenerator />
    </main>
  );
}
