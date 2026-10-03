# Luxe Pro — Sanity Studio

Editorial CMS for property photos, descriptions (PT/EN) and highlights.
Operational data (pricing, availability) stays in Postgres — linked by `slug`.

## Setup (one-time)

1. Create a project at sanity.io (EU dataset region), note the project ID
2. `cp .env.example .env` and fill `SANITY_STUDIO_PROJECT_ID`
3. `npm install && npm run dev` → studio at http://localhost:3333
4. In the web app's `.env.local`, set `NEXT_PUBLIC_SANITY_PROJECT_ID` to the same ID

## Rules

- A property's **slug must match** the `slug` column in the Postgres `properties` table, or its photos/description won't appear on the site.
- First gallery image = listing card image.
- Alt text is required on every image (accessibility).
