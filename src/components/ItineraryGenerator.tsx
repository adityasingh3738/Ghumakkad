"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, MapPin, Users, Wallet, StickyNote, PlaneTakeoff } from "lucide-react";
import { MagneticButton } from "./ui/MagneticButton";
import { AddActivityToCalendarButton, AddDayToCalendarButton } from "./AddToCalendarButton";
import type { Activity } from "@/lib/calendarLinks";

const POPULAR_DESTINATIONS = [
  "Manali", "Goa", "Meghalaya", "Kerala", "Jaipur", "Udaipur", "Agra", "Varanasi",
  "Rishikesh", "Darjeeling", "Shimla", "Ooty", "Munnar", "Andaman Islands",
  "Ladakh", "Spiti Valley", "Sikkim", "Coorg", "Hampi", "Pondicherry",
  "Jaisalmer", "Gokarna", "Kasol", "Tawang"
].sort();

const POPULAR_STARTING_POINTS = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad",
  "Pune", "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow", "Kochi", "Guwahati"
].sort();

const MAX_TRIP_DAYS = 21;

type ParsedItineraryDay = {
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
  stay?: string;
  dayTotal?: string;
};

const formatISODate = (date: Date) => date.toISOString().slice(0, 10);

const getDateRangeLength = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(diffDays) + 1;
};

const formatDayDateLabel = (dateISO: string) => {
  const date = new Date(`${dateISO}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" }).format(date);
};

const parseItineraryMarkdown = (markdown: string, destination: string): ParsedItineraryDay[] => {
  const blocks = markdown
    .split(/\n##\s+/)
    .filter((block) => block.toLowerCase().startsWith("day "));

  const result: ParsedItineraryDay[] = [];

  for (const block of blocks) {
    const headerMatch = block.match(/^Day\s+(\d+)\s*—\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)/i);
    if (!headerMatch) continue;

    const [, dayNumberRaw, title, date] = headerMatch;
    const activities: Activity[] = [];

    for (const line of block.split("\n")) {
      const lineMatch = line.match(/^- \*\*(.*?)\*\* — (.+?)\.\s*\*Cost:\s*₹?([\d,]+)(?:\s*per person)?\*$/i);
      if (!lineMatch) continue;

      const [, time, activityTitle, costRaw] = lineMatch;
      const cost = Number(costRaw.replace(/,/g, ""));
      activities.push({
        id: `${date}-${time}-${activityTitle}`,
        date,
        time: time.trim(),
        title: activityTitle.trim(),
        description: activityTitle.trim(),
        location: destination,
        durationMinutes: 90,
        cost: Number.isFinite(cost) ? cost : 0,
      });
    }

    const stayMatch = block.match(/\*\*🏨 Stay:\*\*\s*(.+?)\s*—\s*₹?([\d,]+)\s*per night/i);
    const dayTotalMatch = block.match(/\*\*💰 Day Total:\*\*\s*₹?([\d,]+)\b/i);

    result.push({
      dayNumber: Number(dayNumberRaw),
      date,
      title: title.trim(),
      activities,
      stay: stayMatch?.[1]?.trim(),
      dayTotal: dayTotalMatch?.[1] ?? "",
    });
  }

  return result;
};

export function ItineraryGenerator() {
  const [budget, setBudget] = useState("");
  const [travellers, setTravellers] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState("");
  const [formError, setFormError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);

  const todayISO = useMemo(() => formatISODate(new Date()), []);
  const computedTripLength = startDate && endDate ? getDateRangeLength(startDate, endDate) : 0;

  const filteredDestinations = destination
    ? POPULAR_DESTINATIONS.filter((d) => d.toLowerCase().includes(destination.toLowerCase()))
    : POPULAR_DESTINATIONS;

  const filteredStartingPoints = startingPoint
    ? POPULAR_STARTING_POINTS.filter((d) => d.toLowerCase().includes(startingPoint.toLowerCase()))
    : POPULAR_STARTING_POINTS;

  const parsedItinerary = useMemo(() => {
    if (!itinerary) return [] as ParsedItineraryDay[];
    return parseItineraryMarkdown(itinerary, destination || "your destination");
  }, [destination, itinerary]);

  const itinerarySummaryMarkdown = useMemo(() => {
    if (!itinerary) return "";

    const budgetSection = itinerary.match(/## Budget Allocation[\s\S]*?(?=\n## Day\s|\n## 💰 Final Cost Summary|$)/i);
    const finalSection = itinerary.match(/## 💰 Final Cost Summary[\s\S]*$/i);

    return [budgetSection?.[0], finalSection?.[0]].filter(Boolean).join("\n\n");
  }, [itinerary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budget || !travellers || !startingPoint || !destination || !startDate || !endDate) {
      setFormError("Please fill all trip details, including the travel dates.");
      return;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const today = new Date(`${todayISO}T00:00:00`);

    if (start < today) {
      setFormError("Start date cannot be in the past.");
      return;
    }

    if (end < start) {
      setFormError("End date must be after the start date.");
      return;
    }

    const tripLength = getDateRangeLength(startDate, endDate);

    if (tripLength > MAX_TRIP_DAYS) {
      setFormError(`Trips longer than ${MAX_TRIP_DAYS} days are not supported in this flow.`);
      return;
    }

    setIsLoading(true);
    setItinerary("");
    setFormError("");

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          travellers,
          startingPoint,
          destination,
          startDate,
          endDate,
          numberOfDays: tripLength,
          days: tripLength,
          notes,
        }),
      });

      const data = await response.json();
      if (data.itinerary) {
        setItinerary(data.itinerary);
      } else {
        setItinerary(`Error: ${data.error || "Failed to generate itinerary. Please try again."}`);
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
              <label className="text-sm font-semibold text-slate-700 ml-1">Starting Point</label>
              <div className="relative">
                <PlaneTakeoff className="absolute left-4 top-1/2 -translate-y-1/2 text-brand h-5 w-5" />
                <input
                  type="text"
                  placeholder="e.g., Delhi, Mumbai, Bangalore"
                  value={startingPoint}
                  onChange={(e) => {
                    setStartingPoint(e.target.value);
                    setShowStartSuggestions(true);
                  }}
                  onFocus={() => setShowStartSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
                {showStartSuggestions && filteredStartingPoints.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredStartingPoints.map((d) => (
                      <div
                        key={d}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors"
                        onClick={() => {
                          setStartingPoint(d);
                          setShowStartSuggestions(false);
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
                    {filteredDestinations.map((d) => (
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
              <label className="text-sm font-semibold text-slate-700 ml-1">Trip Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayISO}
                  required
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-700 ml-1">Trip End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || todayISO}
                  required
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover-target transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="md:col-span-2 text-sm text-slate-500">
              {startDate && endDate ? `Trip length: ${computedTripLength} day${computedTripLength === 1 ? "" : "s"}` : "Choose a start and end date"}
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

            {formError ? (
              <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

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

            {parsedItinerary.length > 0 ? (
              <div className="space-y-8">
                {parsedItinerary.map((day) => (
                  <section key={`${day.date}-${day.dayNumber}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="text-2xl font-bold text-slate-800">
                        Day {day.dayNumber} — {formatDayDateLabel(day.date)}
                      </h4>

                      <AddDayToCalendarButton
                        day={{
                          date: day.date,
                          title: `${destination || "Trip"} — Day ${day.dayNumber}`,
                          description: day.activities
                            .map((activity) => `${activity.time ? `${activity.time} — ` : ""}${activity.title}`)
                            .join("\n"),
                          location: destination,
                          activities: day.activities,
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      {day.activities.length > 0 ? (
                        day.activities.map((activity) => (
                          <div
                            key={`${activity.date}-${activity.time}-${activity.title}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">
                                <span className="text-brand">{activity.time || "Flexible"}</span> — {activity.title}
                              </p>
                              {activity.location ? <p className="text-sm text-slate-500">{activity.location}</p> : null}
                              {typeof activity.cost === "number" && activity.cost > 0 ? (
                                <p className="text-sm text-slate-600">Cost: ₹{activity.cost}</p>
                              ) : null}
                            </div>

                            <AddActivityToCalendarButton activity={activity} />
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">No activities parsed for this day.</p>
                      )}
                    </div>
                  </section>
                ))}

                {itinerarySummaryMarkdown ? (
                  <div className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-headings:text-slate-800 prose-a:text-brand prose-strong:text-slate-800 border-t border-slate-200 pt-8">
                    <ReactMarkdown>{itinerarySummaryMarkdown}</ReactMarkdown>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-headings:text-slate-800 prose-a:text-brand prose-strong:text-slate-800">
                <ReactMarkdown>{itinerary}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
