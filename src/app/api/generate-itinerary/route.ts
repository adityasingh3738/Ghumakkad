import { NextResponse } from "next/server";

export const maxDuration = 60; // Set Vercel function timeout to 60 seconds

export async function POST(req: Request) {
  try {
    const { budget, travellers, startingPoint, destination, days, notes } = await req.json();

    if (!budget || !travellers || !startingPoint || !destination || !days) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials are not configured" },
        { status: 500 }
      );
    }

    const prompt = `
      Create a highly realistic and detailed travel itinerary. Follow these STRICT rules:
      1. EXACT DESTINATION: The trip MUST start from ${startingPoint} and the destination MUST strictly be ${destination}. DO NOT create an itinerary for any other destination (e.g. if the destination is Guwahati, do not write about Lucknow).
      2. EXACT DAYS: You MUST explicitly write out an itinerary that covers ALL ${days} days. Do not stop early. Every single day from Day 1 to Day ${days} must have activities.
      3. STRICT BUDGET LIMIT: The MAXIMUM total budget is exactly ₹${budget} for ALL ${travellers} travellers combined. YOU MUST NOT EXCEED THIS AMOUNT UNDER ANY CIRCUMSTANCES. The sum of all transport, stay, food, and activity costs MUST be less than or equal to ₹${budget}. NEVER suggest an itinerary that costs more than the given budget.
      4. NO NEGATIVE BALANCE: Ensure the final cost calculation leaves a positive or zero remaining budget. Never state a negative remaining budget.
      5. SCALE WITH BUDGET: If the budget is high, suggest better flights, premium AC trains, comfortable 3-star/4-star hotels, and premium experiences. If the budget is tight, you MUST choose cheaper transport (like buses or sleeper trains) and budget stays (hostels or budget hotels). Maximize the value but DO NOT go over the ₹${budget} limit.
      6. REALISTIC COSTS: Ensure that the costs you assign to transport, accommodation, food, and activities are realistic for India. Do not under-price or over-price items just to fit the budget.
      7. NO HALLUCINATIONS: Base everything on real geography, realistic travel times, and real transport routes.
      
      ${notes ? `IMPORTANT NOTE FROM TRAVELER: Make absolutely sure to include the following in the itinerary: "${notes}"` : ""}
      
      Include exact transport options, specific stay names, and precise cost breakdowns for the ${travellers} travellers.
      At the end of the itinerary, provide a clear 'Cost Summary' section showing the total estimated cost and explicitly stating that it is within the ₹${budget} budget.
      Return the response formatted strictly as beautifully structured Markdown. 
      Use Headings for every single day, bold text for important information like costs and timings, and bullet points for activities.
      Do not include any introductory or concluding text outside the Markdown itinerary itself. Make it exciting!
    `;

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
