import { NextResponse } from "next/server";
import { buildItineraryPrompt } from "@/lib/itineraryPrompt";

export const maxDuration = 60; // Set Vercel function timeout to 60 seconds

const getDateRange = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days: string[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export async function POST(req: Request) {
  try {
    const {
      budget,
      travellers,
      startingPoint,
      destination,
      startDate,
      endDate,
      numberOfDays,
      days,
      notes,
      distanceKm,
    } = await req.json();

    const tripDays = Number(numberOfDays ?? days ?? 0);
    const tripDates = startDate && endDate ? getDateRange(startDate, endDate) : [];

    if (!budget || !travellers || !startingPoint || !destination || (!startDate && !endDate && !tripDays)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resolvedDays = tripDates.length > 0 ? tripDates.length : Math.max(tripDays, 1);

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials are not configured" },
        { status: 500 }
      );
    }

    const actualDateList = tripDates.length > 0 ? tripDates : Array.from({ length: resolvedDays }, (_, index) => {
      const start = new Date();
      start.setDate(start.getDate() + index);
      return start.toISOString().slice(0, 10);
    });

    const prompt = buildItineraryPrompt({
      startingPoint,
      destination,
      startDate,
      endDate,
      actualDateList,
      travellers,
      budget,
      notes,
      distanceKm,
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "POST",
        body: JSON.stringify({
          max_tokens: 2500,
          messages: [
            { role: "system", content: "You are an expert travel planner for India." },
            { role: "user", content: prompt }
          ]
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.errors?.[0]?.message || "Cloudflare API error");
    }

    const text = result.result.response;

    return NextResponse.json({ itinerary: text });
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate itinerary. Please try again later." },
      { status: 500 }
    );
  }
}
