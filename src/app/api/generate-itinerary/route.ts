import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert travel planner for budget travelers in India. 
      Create a highly realistic and detailed travel itinerary for a ${days}-day trip with a total budget of ₹${budget}, for ${travellers} travellers, starting from ${startingPoint} and traveling to the destination: ${destination}.
      ${notes ? `IMPORTANT NOTE FROM TRAVELER: Make absolutely sure to include the following in the itinerary: "${notes}"` : ""}
      
      Include exact options like bus or train timings, specific budget stays (e.g., Zostel, local hostels), and precise cost breakdowns.
      Return the response formatted strictly as beautifully structured Markdown. 
      Use Headings for days, bold text for important information like costs and timings, and bullet points for activities.
      Do not include any introductory or concluding text outside the Markdown itinerary itself. Make it exciting!
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ itinerary: text });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return NextResponse.json(
      { error: "Failed to generate itinerary. Please try again later." },
      { status: 500 }
    );
  }
}
