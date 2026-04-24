"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, MapPin, Users, Wallet, CalendarDays, StickyNote } from "lucide-react";
import { MagneticButton } from "./ui/MagneticButton";

const POPULAR_DESTINATIONS = [
  "Manali", "Goa", "Meghalaya", "Kerala", "Jaipur", "Udaipur", "Agra", "Varanasi", 
  "Rishikesh", "Darjeeling", "Shimla", "Ooty", "Munnar", "Andaman Islands", 
  "Ladakh", "Spiti Valley", "Sikkim", "Coorg", "Hampi", "Pondicherry", 
  "Jaisalmer", "Gokarna", "Kasol", "Tawang"
].sort();

export function ItineraryGenerator() {
  const [budget, setBudget] = useState("");
  const [travellers, setTravellers] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredDestinations = destination
    ? POPULAR_DESTINATIONS.filter(d => d.toLowerCase().includes(destination.toLowerCase()))
    : POPULAR_DESTINATIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !travellers || !destination || !days) return;

    setIsLoading(true);
    setItinerary("");

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, travellers, destination, days, notes }),
      });

      const data = await response.json();
      if (data.itinerary) {
        setItinerary(data.itinerary);
      } else {
        setItinerary("Error generating itinerary. Please try again.");
      }
    } catch (error) {
      setItinerary("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="generator" className="py-24 bg-light text-dark min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Plan Your Escape</h2>
          <p className="text-slate-600 text-lg">Let our AI build the perfect, realistic itinerary for your next budget trip.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Destination (in India)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand h-5 w-5" />
                <input
                  type="text"
                  placeholder="e.g., Manali, Goa, Meghalaya"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
                {showSuggestions && filteredDestinations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredDestinations.map(d => (
                      <div
                        key={d}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors"
                        onClick={() => {
                          setDestination(d);
                          setShowSuggestions(false);
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Total Budget (₹)</label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-brand h-5 w-5" />
                <input
                  type="number"
                  placeholder="e.g., 10000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="500"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Travellers</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brand h-5 w-5" />
                <input
                  type="number"
                  placeholder="e.g., 2"
                  value={travellers}
                  onChange={(e) => setTravellers(e.target.value)}
                  required
                  min="1"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Number of Days</label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-brand h-5 w-5" />
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  required
                  min="1"
                  max="30"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Must-Do / Special Notes (Optional)</label>
              <div className="relative">
                <StickyNote className="absolute left-4 top-4 text-brand h-5 w-5" />
                <textarea
                  placeholder="e.g., Must include a visit to local cafes, want a day for trekking..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800 resize-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-4 flex justify-center">
              <MagneticButton type="submit" className="w-full md:w-auto px-12 py-5 text-lg shadow-lg shadow-brand/30" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Itinerary"
                )}
              </MagneticButton>
            </div>
          </form>
        </div>

        {itinerary && (
          <div className="mt-16 bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <h3 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-brand to-cyan-500">
              Your Epic Itinerary
            </h3>
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-headings:text-slate-800 prose-a:text-brand prose-strong:text-slate-800">
              <ReactMarkdown>{itinerary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
