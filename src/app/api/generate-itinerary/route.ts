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
      Create a highly realistic and detailed travel itinerary for a ${days}-day trip with a total budget of ₹${budget}, for ${travellers} travellers, starting from ${startingPoint} and traveling to the destination: ${destination}.
      ${notes ? `IMPORTANT NOTE FROM TRAVELER: Make absolutely sure to include the following in the itinerary: "${notes}"` : ""}
      
      Include exact options like bus or train timings, specific budget stays (e.g., Zostel, local hostels), and precise cost breakdowns.
      Return the response formatted strictly as beautifully structured Markdown. 
      Use Headings for days, bold text for important information like costs and timings, and bullet points for activities.
      Do not include any introductory or concluding text outside the Markdown itinerary itself. Make it exciting!
    `;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an expert travel planner for budget travelers in India." },
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
