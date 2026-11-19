# Homebuying Guide — 6 Months

A static website that presents a six-month homebuying guide as a single page, with a built-in research agent.

## What is on the page

- **Overview** — the 3 Rules for HomeBuying and the plan's shape.
- **Planning Phase (3 Months)** — a day-by-day plan from Day 1 ("Write down your Why") to Day 60 (moving logistics): budget clean-up, credit polish, documents, spam-call prevention, loan officer, targets, practice payments, savings plan, needs/wants, exit plan, agent, inspector.
- **Shopping Phase (2 Months)** — explore homes, review comps, make an offer.
- **Closing Phase (1 Month)** — the closing stage table (stage and responsible party) and how the first payment date works.
- **Additional Reading Resources** — homebuying guides, a Bay Area buying guide, and a buyer preparation checklist.
- **Calculators & References** — pre-approval, agent referral, today's rates, max purchase price, loan comparison, buying timeline, student loan, and credit score tools.
- **Videos** — the guide's YouTube links render as labelled video cards that open on YouTube.

## Research agent

The agent panel at the bottom of the page researches any homebuying topic:

1. The visitor pastes a Google AI API key into a password field. The key is kept only in the browser tab's sessionStorage and is sent only to generativelanguage.googleapis.com.
2. The visitor enters a research topic and runs the agent.
3. The page calls Gemini (gemini-3.5-flash) with Google Search grounding. The prompt embeds the full text of this guide, so the agent separates "What the guide says" from "What the research found", cites sources, and ends with concrete next steps.

No API key is stored in this repository or in the page code.

## Files

- `index.html` — the whole site: content, styles, and the agent, in one self-contained file. No build step.
- `README.md` — this file.

## Hosting

The site is plain static HTML. Serve the folder with any static host (for example GitHub Pages: publish the repository root on the `main` branch).
