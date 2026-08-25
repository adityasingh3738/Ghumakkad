export interface BudgetGuidance {
  tier: "budget" | "mid-range" | "premium" | "luxury";
  tierDescription: string;
  intercityTransportCap: number;
  accommodationCap: number;
  foodCap: number;
  localTransportCap: number;
  activitiesCap: number;
  bufferCap: number;
  perPersonPerDay: number;
}

/**
 * Computes a suggested budget split so the model fills in numbers close to
 * fixed targets instead of inventing and summing a split itself.
 */
export function computeBudgetGuidance(
  budget: number,
  travellers: number,
  days: number
): BudgetGuidance {
  const perPersonPerDay = budget / travellers / days;

  let tier: BudgetGuidance["tier"];
  let tierDescription: string;

  if (perPersonPerDay < 1500) {
    tier = "budget";
    tierDescription =
      "Sleeper trains/buses, hostels or budget hotels (₹300-1500/night), street food and dhabas.";
  } else if (perPersonPerDay < 3500) {
    tier = "mid-range";
    tierDescription =
      "AC trains or buses, budget-to-mid hotels (₹1500-3500/night), mix of street food and mid-range restaurants.";
  } else if (perPersonPerDay < 7000) {
    tier = "premium";
    tierDescription =
      "Flights where sensible, 3-4 star hotels (₹3500-6000/night), good restaurants.";
  } else {
    tier = "luxury";
    tierDescription =
      "Flights, 4-5 star hotels (₹6000-12000+/night), fine dining.";
  }

  const splits = {
    intercity: 0.25,
    accommodation: 0.35,
    food: 0.2,
    localTransport: 0.08,
    activities: 0.09,
    buffer: 0.03,
  };

  const round = (n: number) => Math.round(n / 10) * 10;

  return {
    tier,
    tierDescription,
    perPersonPerDay,
    intercityTransportCap: round(budget * splits.intercity),
    accommodationCap: round(budget * splits.accommodation),
    foodCap: round(budget * splits.food),
    localTransportCap: round(budget * splits.localTransport),
    activitiesCap: round(budget * splits.activities),
    bufferCap: round(budget * splits.buffer),
  };
}

export interface ItineraryPromptParams {
  startingPoint: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  actualDateList: string[];
  travellers: number;
  budget: number;
  notes?: string;
  distanceKm?: number;
}

export function buildItineraryPrompt(params: ItineraryPromptParams): string {
  const {
    startingPoint,
    destination,
    startDate,
    endDate,
    actualDateList,
    travellers,
    budget,
    notes,
    distanceKm,
  } = params;

  const effectiveDates = actualDateList.length > 0 ? actualDateList : [startDate ?? "TBD"];
  const resolvedDays = effectiveDates.length;
  const guidance = computeBudgetGuidance(budget, travellers, resolvedDays);

  const startLabel = startDate ?? effectiveDates[0] ?? "TBD";
  const endLabel = endDate ?? effectiveDates[effectiveDates.length - 1] ?? "TBD";

  const distanceLine = distanceKm
    ? `- Approximate road/rail distance: ${distanceKm} km (use this — do not re-estimate it).`
    : `- Distance was not pre-computed — reason carefully about real geography between ${startingPoint} and ${destination} before choosing a transport mode.`;

  const transportModeGuidance = distanceKm
    ? distanceKm > 500
      ? "Valid intercity modes: flight, overnight train, or long-distance AC/sleeper bus. Do NOT suggest a cab or local transport for this leg."
      : distanceKm > 100
        ? "Valid intercity modes: train, AC bus, or flight. Do NOT suggest a cab or local transport for this leg."
        : "Valid intercity modes: local train, bus, or outstation cab."
    : "Verify the real distance mentally before picking a mode: >500km → flight/overnight train/long-distance bus only; 100-500km → train/AC bus/flight; <100km → local train/bus/outstation cab.";

  return `
You are an expert Indian travel planner. You know real transport routes, realistic hotel price ranges, and real travel logistics across India.

TRIP FACTS
- From: ${startingPoint}  →  To: ${destination}
- Dates: ${startLabel} to ${endLabel} (${resolvedDays} days)
- Trip date sequence (use these exact dates, in this order, do not invent or skip any): ${effectiveDates.map((d, i) => `Day ${i + 1}=${d}`).join(", ")}
- Travellers: ${travellers}
- Total budget for ALL travellers combined: ₹${budget} (hard ceiling)
${notes ? `- Special requirements: ${notes}` : ""}
${distanceLine}

BUDGET TARGETS (already calculated for you — fill in real items that add up close to these, do not recalculate the split yourself)
- Trip quality tier: ${guidance.tier} (₹${Math.round(guidance.perPersonPerDay)}/person/day) — ${guidance.tierDescription}
- Intercity transport (to & fro, all travellers): target ~₹${guidance.intercityTransportCap}
- Accommodation (all nights): target ~₹${guidance.accommodationCap}
- Food (all days, all travellers): target ~₹${guidance.foodCap}
- Local transport within ${destination}: target ~₹${guidance.localTransportCap}
- Activities & entry fees: target ~₹${guidance.activitiesCap}
- Buffer: ~₹${guidance.bufferCap}
- These six numbers must sum to ₹${budget}. Stay within ±15% of each target — if a category needs more, take it from another category, don't exceed the total.

TRANSPORT RULES
- ${transportModeGuidance}
- Within ${destination}, use autos/cabs/metro/local buses freely — price realistically (short ride ₹50-150, longer ride ₹150-300, airport/station transfer ₹300-500).
- Prefer describing transport CATEGORICALLY ("an overnight AC express train", "a long-distance Volvo AC sleeper bus") rather than inventing a specific train/bus number or name. Only name a specific real, well-known service (e.g. "Rajdhani Express") if you are highly confident it actually runs that route — a wrong specific name is worse than an accurate general description.

DESTINATION & REALISM RULES
- Every place named must actually be in or near ${destination}. Do not mention places from other cities except a genuine transit stop.
- If you're not certain a specific hotel/restaurant/landmark exists, describe the type and locality instead of inventing a name (e.g. "a mid-range hotel near Lake Pichola" rather than a fabricated hotel name).
- If ${destination} needs special permits (e.g. parts of Northeast India), say so on Day 1.
- Respect real opening hours (most monuments 9am-6pm, many closed one day/week — e.g. Taj Mahal closed Fridays) and real meal windows (breakfast 8-9am, lunch 1-2pm, dinner 7-9pm).
- Max 4-5 attractions per day, accounting for travel time between them. No vague filler like "explore the city freely" — every line needs a specific place, time, and cost.
- Account for arrival time on Day 1 (don't schedule morning activities right after a realistic late arrival) and departure/checkout on the last day.

MATH RULES (double-check by actually adding the numbers, not estimating)
- Multiply any "per person" cost by ${travellers} before adding it into a total.
- Day Total = sum of that day's line items exactly.
- Final Total = sum of all Day Totals exactly.
- Remaining = ₹${budget} − Final Total, and must be ≥ 0. If your running total is about to exceed ₹${budget}, swap in a cheaper option before finishing the day — don't just let it go negative.

OUTPUT FORMAT — STRICT MARKDOWN, following this exact structure and worked example:

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

--- EXAMPLE DAY (structure + arithmetic to imitate — replace all content with real details for this trip) ---
## Day 1 — Temples and Old City Charm (2026-09-12)
**Base:** Staying near Paltan Bazaar

- **09:00 AM** — Visit Clock Tower and Paltan Bazaar. *Cost: ₹0*
- **11:00 AM** — Robber's Cave (Guchhupani) entry and short trek. *Cost: ₹40 per person*
- **01:30 PM** — Lunch at a local Garhwali-style dhaba. *Cost: ₹250 per person*
- **04:00 PM** — Auto from Paltan Bazaar to Sahastradhara. *Cost: ₹200*

**🏨 Stay:** Budget hotel near Paltan Bazaar — ₹1200 per night
**💰 Day Total:** ₹1200 (Stay) + ₹200 (Transport) + ₹580 (Food: ₹290×2 travellers) + ₹80 (Activities: ₹40×2 travellers) = ₹2060

---
--- END EXAMPLE — now write every real day using this exact structure ---

Write one such block for EVERY date in the trip date sequence above, in order, using the real ISO date in each header.

End with:

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

Before you finish, re-add every Day Total by hand and confirm the Final Total matches their sum, and that Remaining is not negative. Use the exact trip dates given — never invent extra dates. Tone: exciting and aspirational, but never at the cost of accuracy.
`;
}
