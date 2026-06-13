# Flora AI

Flora AI is a browser-based sales training workspace for floral retail teams. It helps consultants practice scenario-specific recommendations, flower-language explanations, bouquet pairing logic, and customer-facing sales scripts with an AI coach.

The current product is optimized for a lightweight deployment model: a single-page frontend, static floral training content, and a Vercel Serverless Function that proxies AI coaching requests to DeepSeek without exposing the API key in the browser.

## Live Product

- Production: <https://floral-sales-consultant.vercel.app>
- Runtime: static HTML/CSS/JavaScript plus Vercel Serverless Functions
- AI provider: DeepSeek Chat API

## What It Does

- Provides scenario-based floral sales training for common customer intents.
- Recommends flowers, meanings, bouquet composition, and sales positioning.
- Offers reusable scripts for upselling, objection handling, and sensitive occasions.
- Supports an AI coaching mode for free-form customer situations.
- Includes a quick flower-language reference panel.
- Works on desktop and mobile layouts.

## Product Requirements Document

### 1. Product Summary

Flora AI is a training assistant for flower shop sales consultants. The product turns practical floral retail knowledge into an interactive coaching interface so staff can quickly learn what to recommend, what to avoid, and how to say it to customers.

The initial release focuses on guided sales education rather than order management, inventory, CRM, or payment workflows.

### 2. Problem Statement

Flower shop consultants often need to make fast recommendations under emotional and cultural constraints. A birthday bouquet, apology bouquet, hospital visit arrangement, or wedding gift can each require different flower choices, color rules, taboo avoidance, and conversational tone.

New consultants may know the product catalog but still struggle with:

- matching flowers to customer intent,
- explaining flower meanings in a persuasive way,
- handling price objections,
- avoiding culturally sensitive mistakes,
- turning a recommendation into a polished sales script.

Flora AI reduces that training gap by packaging sales knowledge into repeatable scenarios and AI-assisted practice.

### 3. Target Users

Primary users:

- New floral sales consultants who need structured onboarding.
- Shop assistants who need quick wording support during customer conversations.
- Store owners who want consistent sales training across staff.

Secondary users:

- Floral course instructors.
- Small shop operators preparing seasonal sales scripts.
- Social commerce sellers responding to WeChat or marketplace inquiries.

### 4. Goals

- Make floral sales training faster and more consistent.
- Help consultants produce customer-ready scripts in seconds.
- Provide scenario-specific flower recommendations and taboo reminders.
- Keep the interface simple enough for repeated use during training sessions.
- Protect AI provider credentials by keeping API calls behind a serverless proxy.

### 5. Non-Goals

- No checkout, cart, payment, or order fulfillment.
- No real inventory management.
- No customer account system.
- No medical or therapeutic claims about flowers.
- No replacement for store-specific pricing, stock, or local customs review.

### 6. Core User Stories

- As a new consultant, I want to choose a customer scenario so I can learn the recommended flowers and scripts.
- As a consultant, I want to describe a customer request in natural language so the AI can coach me on what to say.
- As a trainer, I want scripts and taboo reminders grouped by scenario so staff can practice consistently.
- As a seller, I want quick flower-language lookup so I can explain meaning without searching elsewhere.
- As a mobile user, I want the same training flow to work on a phone during shop-floor practice.

### 7. Functional Requirements

Scenario training:

- Display a fixed list of floral sales scenarios.
- Show each scenario's recommended flowers, flower language, bouquet arrangement, selling points, scripts, tips, and warnings.
- Allow users to select scenarios from desktop sidebar or mobile horizontal selector.

AI coaching:

- Accept free-form customer descriptions from the input box.
- Send the current scenario, scenario library, flower reference, and user message to the backend AI proxy.
- Return concise coaching output focused on scenario judgment, flower recommendation, script, follow-up questions, and pitfalls.
- Fall back to local rule-based responses if the AI request fails.

Reference library:

- Display flower names and meanings in a quick lookup panel.
- Allow users to click a flower reference and ask about meaning or pairing.

Responsive behavior:

- Desktop layout uses left scenario navigation, central chat workspace, and right reference panel.
- Mobile layout uses top scenario selector, tabbed content, and bottom navigation.

Security:

- Do not expose `DEEPSEEK_API_KEY` to frontend code.
- Keep `.env` out of source control.
- Proxy all AI requests through `/api/chat`.

### 8. UX Requirements

- The first screen should be the working training interface, not a marketing landing page.
- The visual language should feel warm, floral, and professional.
- Scenario navigation should be scannable and low-friction.
- Chat responses should remain readable with clear spacing and consistent hierarchy.
- The favicon and app icon should visually signal floral retail training.

### 9. Content Requirements

Each training scenario should include:

- scenario name,
- short brief,
- tags,
- customer intent example,
- recommended flowers,
- flower meanings,
- arrangement guidance,
- sales scripts,
- selling tips,
- avoid list.

AI-generated content should:

- be in Chinese,
- be concise and practical,
- avoid vague motivational language,
- avoid unsafe medical claims,
- avoid offensive or culturally careless recommendations.

### 10. Technical Requirements

Frontend:

- Plain HTML, CSS, and JavaScript in `index.html`.
- No build step required for the static UI.
- Local rule-based fallback for core interactions.

Backend:

- `api/chat.js` implements the Vercel Serverless Function.
- `dev-server.js` provides a local development server and local `/api/chat` proxy.
- `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` are read from environment variables.

Deployment:

- `vercel.json` defines static asset and API routing.
- `.vercelignore` excludes local-only files and large source assets.
- Production is deployed to Vercel.

### 11. Success Metrics

Product quality:

- A new user can identify and select a scenario within 10 seconds.
- A consultant can generate a usable sales script within one AI response.
- The interface loads on desktop and mobile without horizontal overflow.

Training effectiveness:

- Staff can explain flower recommendations and taboos with less trainer intervention.
- Staff can reuse generated scripts in simulated customer conversations.

Operational health:

- The static page returns HTTP 200 in production.
- `/api/chat` returns a valid AI response when environment variables are configured.
- Favicon and static assets load correctly.

### 12. Risks and Mitigations

- Risk: AI may produce culturally inappropriate or inaccurate recommendations.
  Mitigation: Keep scenario data and guardrails in the prompt; retain local curated content.

- Risk: API key leakage.
  Mitigation: Keep AI calls server-side and ignore `.env`.

- Risk: flower availability or pricing differs by store.
  Mitigation: Position recommendations as training guidance, not live inventory truth.

- Risk: UI becomes content-heavy.
  Mitigation: Keep scenario navigation, reference lookup, and chat output separated.

### 13. Release Scope

Current release:

- Static training interface.
- Eight curated sales scenarios.
- DeepSeek-backed coaching endpoint.
- Local fallback responses.
- Desktop and mobile responsive layouts.
- Vercel production deployment.

Future releases:

- Store-specific catalog and price configuration.
- Trainer-authored scenario editor.
- Practice scoring rubric.
- Conversation history export.
- Multi-language training packs.
- Staff progress tracking.

## Architecture

```text
Browser
  |
  | static UI, scenario data, user messages
  v
index.html
  |
  | POST /api/chat
  v
Vercel Serverless Function: api/chat.js
  |
  | DeepSeek Chat Completions API
  v
AI coaching response
```

Local development uses `dev-server.js` to serve the static page and proxy `/api/chat` in the same shape as production.

## Project Structure

```text
.
├── api/chat.js                    # Vercel AI proxy endpoint
├── assets/favicon.png             # Browser favicon
├── assets/flora-bouquet-icon-256.png
├── dev-server.js                  # Local dev server
├── index.html                     # Main application UI
├── package.json
├── vercel.json                    # Vercel static and API routing
└── README.md
```

## Environment Variables

Create a local `.env` file:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
```

For Vercel production, configure:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`

## Local Development

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Validation

Useful checks:

```bash
node --check dev-server.js
node --check api/chat.js
npx cspell README.md
npx markdownlint-cli2 README.md
```

Production smoke tests:

```bash
curl -I https://floral-sales-consultant.vercel.app/
curl -I https://floral-sales-consultant.vercel.app/assets/favicon.png
curl https://floral-sales-consultant.vercel.app/api/chat \
  -H 'Content-Type: application/json' \
  --data '{"message":"测试接口","scenes":[],"flowerRef":[]}'
```

## Deployment

Production deployment:

```bash
npx vercel --prod --yes
```

The deployment uses `vercel.json` to serve the static app and route `/api/chat` to the serverless function.

## License

Private project. All rights reserved.
