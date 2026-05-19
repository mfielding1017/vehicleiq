# VehicleIQ MVP

A Next.js starter app for vehicle photo identification and two-photo vehicle visual comparison.

## Features

- Upload one vehicle photo and get likely make/model/year range
- Upload two vehicle photos and get a cautious percent visual match
- Feature-by-feature comparison
- Clean mobile-friendly interface
- API routes powered by OpenAI vision via the Vercel AI SDK

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
```

Run locally:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Important Notes

This app should not claim legal certainty. Vehicle comparison outputs should use cautious language like:

- visually consistent
- possible match
- insufficient evidence
- likely different

Do not use this as the sole basis for accusations, enforcement decisions, or legal conclusions.

## Next Features to Add

- User accounts
- Upload history
- Stripe subscriptions
- Admin review queue
- Vehicle reference database
- User feedback: correct / incorrect
- Search by make/model/year
- Saved comparison reports as PDF
