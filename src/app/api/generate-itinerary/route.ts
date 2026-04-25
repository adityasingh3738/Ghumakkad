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
You are an expert Indian travel planner with deep knowledge of real transport routes, actual hotel prices, and realistic travel logistics across India.

TRIP DETAILS:
- Starting point: ${startingPoint}
- Destination: ${destination}
- Number of days: ${days}
- Number of travellers: ${travellers}
- Total budget (for ALL travellers combined): ₹${budget}
${notes ? `- Special requirements: ${notes}` : ''}

==============================
STRICT RULES — VIOLATING ANY OF THESE MAKES YOUR RESPONSE INVALID
==============================

INTERCITY TRANSPORT RULES:
- Before suggesting ANY intercity transport, verify the actual distance between ${startingPoint} and ${destination}.
- NEVER suggest an auto-rickshaw or local cab for intercity travel between two different cities.
- NEVER suggest a direct flight if no direct flight exists on that route.
- NEVER suggest a train route that does not exist on Indian Railways.
- For intercity distances above 500km, the ONLY valid options are: flight, overnight train, or long-distance AC/sleeper bus.
- For intercity distances between 100-500km, valid options are: train, AC bus, or flight.
- For intercity distances under 100km, valid options are: local train, bus, or outstation cab.
- Always mention the REAL train name and number (e.g. Rajdhani Express 12301) or real bus operator when suggesting those.
- Always mention realistic travel time for the mode of transport chosen.

WITHIN-CITY TRANSPORT (use freely and realistically):
- Auto-rickshaws, local cabs (Ola/Uber), cycle rickshaws, metro, local buses are all valid for getting around within ${destination}.
- Price autos and cabs realistically: ₹50-150 for short rides, ₹150-300 for longer city rides, ₹300-500 for airport/station transfers.
- Suggest the most practical local transport for that specific city — e.g. metro in Delhi/Mumbai, auto in Guwahati, cycle rickshaw in Varanasi old city, shared jeep in hill stations.
- Account for local traffic and realistic travel time between attractions within the city.

DESTINATION RULES:
- Every single activity, hotel, restaurant, and landmark you mention MUST be physically located in or near ${destination}.
- Do NOT mention places from other cities unless they are a transit stop en route to ${destination}.
- If ${destination} is a smaller city with fewer attractions, be honest about that and suggest realistic local experiences instead of fabricating landmarks.
- If ${destination} requires special permits (e.g. certain Northeast India destinations like Arunachal Pradesh), mention that upfront on Day 1.

BUDGET RULES:
- Total budget is ₹${budget} for ${travellers} traveller(s). This is a hard ceiling — never exceed it.
- Allocate the budget BEFORE writing the itinerary: split into transport, accommodation, food, and activities.
- If the budget is too low for flights, suggest trains or buses instead. Never suggest a transport mode that exceeds the allocated transport budget.
- Use these realistic Indian price ranges:
  * Hotels per room per night: budget hostel ₹300-700, budget hotel ₹700-1500, mid-range ₹1500-3500, 3-star ₹3500-6000, 4-star ₹6000-12000, 5-star ₹12000+
  * Food per person per day: street food/dhabas ₹150-400, mid-range restaurant ₹400-800, good restaurant ₹800-1500, fine dining ₹1500+
  * Local transport per ride: auto ₹50-150, city cab ₹150-300, airport/station transfer ₹300-500
  * Activities: entry fees for most Indian monuments are ₹20-600 for Indians, ₹500-1500 for foreigners
- Scale quality with budget: tight budget = sleeper trains + hostels + dhabas. High budget = flights + 3-4 star hotels + good restaurants. Never mismatch quality with budget.
- The final cost summary must show zero or positive remaining balance. NEVER show a negative remaining budget.

DAY COVERAGE RULES:
- You MUST write a detailed plan for ALL ${days} days without exception. Day 1 through Day ${days} — every single one.
- Day 1 must account for travel time from ${startingPoint} to ${destination}. If travel takes most of Day 1, only schedule activities after the realistic arrival time.
- The last day must account for checkout time and return journey if applicable.
- Do NOT pad days with vague filler like "explore the city freely." Every activity must have a specific place name, realistic timing, and cost.
- Do not schedule more than 4-5 attractions per day. Account for travel time between places, meals, and rest.

REALISM & ANTI-HALLUCINATION RULES:
- Only mention hotels, restaurants, and attractions that actually exist. If you are not certain a specific place exists, describe the type instead (e.g. "a local dhaba near the bus stand") rather than making up a name.
- Timings must be logical. Never schedule a morning activity right after a late-night arrival. Never schedule 8 places in one morning.
- Account for realistic opening hours — most monuments open around 9am and close by 5-6pm. Many are closed on specific days (e.g. Taj Mahal closed on Fridays).
- Account for realistic meal times: breakfast 8-9am, lunch 1-2pm, dinner 7-9pm.
- Mention seasonal relevance where applicable — beach destinations in monsoon, hill stations in winter, etc.
- If a journey involves a layover or transit city, mention it but do not build a full itinerary around the transit city.

THINGS YOU MUST NEVER DO:
- Never suggest an auto or local cab for travel between two different cities.
- Never suggest a train that doesn't run on that route.
- Never list attractions, hotels, or restaurants from the wrong city.
- Never exceed the ₹${budget} total budget.
- Never skip a day — all ${days} days must be covered.
- Never show a negative remaining budget.
- Never suggest a hotel without specifying the area or locality it is in.
- Never schedule activities without realistic timings.
- Never suggest a direct flight on a route where none exists.
- Never recommend an activity that is geographically impossible given the day's schedule.

==============================
CRITICAL MATH & CALCULATION RULES (DOUBLE CHECK YOUR ADDITION)
==============================
- Large language models are notoriously bad at math. You MUST double-check your addition!
- PAY ATTENTION TO TRAVELLER COUNT: There are ${travellers} travellers. If you quote a "per person" cost (like meals or flight tickets), you MUST multiply it by ${travellers} when adding it to the Day Total and Final Summary.
- The Day Total MUST equal the exact sum of that day's Transport + Food + Stay + Activities.
- The Final Cost Summary MUST equal the exact sum of all the Day Totals.
- Total + Remaining MUST exactly equal ₹${budget}.
- DO NOT hallucinate the final total. Actually add up the numbers you wrote in the table.

==============================
OUTPUT FORMAT — RETURN STRICTLY AS MARKDOWN
==============================

Start with a budget allocation table:

## Budget Allocation
| Category | Estimated Cost |
|---|---|
| Intercity Transport (to & fro) | ₹X |
| Accommodation (X nights) | ₹X |
| Food (X days) | ₹X |
| Local Transport within ${destination} | ₹X |
| Activities & Entry Fees | ₹X |
| Buffer | ₹X |
| **Total** | **₹X / ₹${budget} ✅** |

Then for each day:

## Day N — [Catchy Day Title]
**Date context:** Day N of ${days}
**Base:** [Area/locality where they are staying]

- **[HH:MM AM/PM]** — [Activity with specific place name]. *Cost: ₹X per person*
- **[HH:MM AM/PM]** — [Meal suggestion with type of place or real restaurant name]. *Cost: ₹X per person*
- **[HH:MM AM/PM]** — [Next activity]. *Cost: ₹X per person*
- **[HH:MM AM/PM]** — [Local transport detail e.g. "Auto from X to Y"]. *Cost: ₹X*

**🏨 Stay:** [Hotel name or type] in [locality] — ₹X per night
**💰 Day Total:** ₹X (Transport: ₹X | Food: ₹X | Stay: ₹X | Activities: ₹X)

---

End with a cost summary:

## 💰 Final Cost Summary
| Category | Cost |
|---|---|
| Intercity Transport | ₹X |
| Accommodation | ₹X |
| Food | ₹X |
| Local Transport | ₹X |
| Activities | ₹X |
| **Total** | **₹X** |
| **Budget** | **₹${budget}** |
| **Remaining** | **₹X ✅** |

Make the tone exciting and aspirational — but never at the cost of accuracy.
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
