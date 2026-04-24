# Travelly - Project Context & Agent Handoff

## Project Overview
Travelly is a premium, AI-powered budget travel itinerary generator specifically designed for Indian destinations. It takes user inputs (Starting Point, Destination, Budget, Travellers, Days, and Notes) and uses a Large Language Model (LLM) to generate a highly detailed, day-by-day markdown itinerary including transport, accommodation, and precise cost breakdowns.

## Tech Stack
- **Frontend Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, custom Google Fonts (Outfit, Plus Jakarta Sans)
- **Animations:** GSAP (for the custom travel-themed cursor) & basic Tailwind transitions
- **Icons:** Lucide React
- **Markdown Rendering:** `react-markdown`
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
1. **Starting Point Feature:** Added a mandatory "Starting Point" input to the form with a dropdown autocomplete feature (similar to Destinations).
2. **Logo Issue:** Removed CSS `mix-blend-multiply` since the user provided a transparent `.png` logo.
3. **Prompt Engineering Fixes (Llama 3.1):** 
   The AI prompt in `route.ts` was significantly hardened to fix the following issues:
   - **Day Limits:** Forced the AI to explicitly write out all X days instead of stopping at Day 2.
   - **Budget Scaling:** Instructed the AI to scale recommendations based on the budget (e.g., if the budget is high, suggest premium flights and 4-star hotels instead of defaulting to cheap buses).
   - **Hallucinations:** Added strict negative prompting to stick *only* to the requested destination (e.g., if Varanasi to Guwahati, do not output Lucknow) and to use real geography.
   - **Exact Math:** Enforced exact accounting for the number of travellers.
4. **Error Handling:** The UI now displays the exact backend error message instead of a generic "Please try again", which helps drastically in debugging API quotas.

## Current State & Next Steps
The app is fully functional and deployed on Vercel. 
- **Repository:** Up to date. All recent changes (including the strict prompt rewrite and Cloudflare integration) have been committed to `main` and pushed.
- **Future Work:** If the Llama 3.1 model struggles to follow the strict formatting or continues to hallucinate Indian geography (since Llama is less localized than Gemini), the next step would be switching back to Gemini (using a fresh paid/billed Google Cloud account) or trying Groq API for faster Llama 3/Mixtral inference.
