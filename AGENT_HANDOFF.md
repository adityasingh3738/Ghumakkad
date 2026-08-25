# Travelly - Project Context & Agent Handoff

## Project Overview
Travelly is a premium, AI-powered budget travel itinerary generator specifically designed for Indian destinations. It takes user inputs (Starting Point, Destination, Budget, Travellers, Trip Dates, and Notes) and uses a Large Language Model (LLM) to generate a highly detailed, day-by-day markdown itinerary including transport, accommodation, cost breakdowns, and date-aware daily planning.

## Tech Stack
- **Frontend Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, custom Google Fonts (Outfit, Plus Jakarta Sans)
- **Animations:** GSAP (for the custom travel-themed cursor) & basic Tailwind transitions
- **Icons:** Lucide React
- **Markdown Rendering:** `react-markdown`
- **Google Calendar:** client-side quick-add links via Google Calendar URL templates
- **Hosting:** Vercel

## API & Backend (Crucial Changes)
The project initially used the Google Gemini API (`gemini-2.5-flash`), but due to Google rate limits (429 Quota Exceeded) and 503 errors on the free tier, **the backend was completely rewritten to use Cloudflare Workers AI**.

### Current AI Implementation:
- **Provider:** Cloudflare Workers AI REST API
- **Model:** `@cf/meta/llama-3.1-8b-instruct`
- **Location:** `src/app/api/generate-itinerary/route.ts`
- **Vercel Config:** `export const maxDuration = 60;` is set to prevent 10s/15s serverless function timeouts on Vercel's hobby tier.

### Required Environment Variables (Vercel)
- `CLOUDFLARE_ACCOUNT_ID` (User's Cloudflare Account ID)
- `CLOUDFLARE_API_TOKEN` (Workers AI API Token)
*(Note: `GEMINI_API_KEY` is no longer used and can be safely ignored/deleted).*

## Latest Improvements & Bug Fixes
1. **Date Range Flow:** Replaced the old "Number of Days" field with a start-date/end-date picker. The app calculates the inclusive trip length and sends the derived `numberOfDays` to the API.
2. **Actual Date Injection:** The backend prompt now receives real date values and is instructed to use exact trip dates, rather than generic "Day 1 / Day 2" placeholders. The app computes the date list and injects it directly.
3. **Starting Point Feature:** Added a mandatory "Starting Point" input to the form with a dropdown autocomplete feature (similar to Destinations).
4. **Logo Issue:** Removed CSS `mix-blend-multiply` since the user provided a transparent `.png` logo.
5. **Prompt Engineering Fixes (Llama 3.1):**
   The AI prompt in `route.ts` was significantly hardened to fix the following issues:
   - **Day Limits:** Forced the AI to explicitly write out all X days instead of stopping at Day 2.
   - **Strict Budget Limits:** Enforced a hard upper limit on the budget to prevent the LLM from generating itineraries that cost 25k on a 15k budget, which resulted in a negative remaining budget. The AI is now instructed to explicitly downgrade options (e.g., sleeper trains instead of flights) when the budget is tight.
   - **Budget Scaling:** Instructed the AI to scale recommendations based on the budget (e.g., if the budget is high, suggest premium flights and 4-star hotels instead of defaulting to cheap buses).
   - **Hallucinations:** Added strict negative prompting to stick *only* to the requested destination (e.g., if Varanasi to Guwahati, do not output Lucknow) and to use real geography.
   - **Exact Math:** Enforced exact accounting for the number of travellers.
6. **Google Calendar Integration:** Added client-side quick-add calendar links so users can push day-level or activity-level items to Google Calendar without OAuth or backend calls.
7. **Error Handling:** The UI now displays the exact backend error message instead of a generic "Please try again", which helps drastically in debugging API quotas.

## Date and Calendar Logic
- Trip dates are validated on the client before submit.
- Start date must not be in the past.
- End date must be after the start date.
- Max trip length has a reasonable cap of 21 days unless business rules change.
- `date` values are treated as true ISO date strings such as `2026-09-12`.
- Calendar buttons use the Google Calendar quick-add URL format and are intentionally client-side only.

## Current State & Next Steps
The app is fully functional and deployed on Vercel.
- **Repository:** Up to date. Recent changes include the strict prompt rewrite, Cloudflare integration, real-date trip handling, and calendar quick-add flow.
- **Future Work:** If the Llama 3.1 model struggles to follow the strict formatting or continues to hallucinate Indian geography (since Llama is less localized than Gemini), the next step would be switching back to Gemini (using a fresh paid/billed Google Cloud account) or trying Groq API for faster Llama 3/Mixtral inference.

## Important Working Rules for Agents
- Do not hardcode API keys in the source.
- Keep the Cloudflare AI model and budget/realism constraints intact unless there is a specific prompt change requirement.
- When modifying the itinerary prompt, keep the output format strict and budget-safe.
- Prefer small, targeted changes over broad refactors.
- Date range validation is required before any itinerary generation request is sent.
- If making itinerary UI changes, preserve the date-aware structure and the Google Calendar quick-add behavior.
