# Dating Prototype

A mobile-first dating app **prototype** (working name). It's built around one journey:

**find → understand → match → talk → meet**

Profiles carry enough personality to understand someone, discovery is a small curated set rather than an endless feed, and safety tools are free for everyone. There are no games, streaks, coins, boosts, Super Likes, popularity scores or match expiry.

This is a front-end prototype: there is **no backend, no real accounts and no payments**. All data is fictional and stored in your browser.

## Tech stack

- React 19 + TypeScript (strict) + Vite
- React Router (hash routing) for static hosting
- Plain CSS with design tokens (`src/design/tokens.css`), light and dark themes
- `localStorage` behind async repository interfaces, ready to be replaced by a real backend
- Deployed as a static site to GitHub Pages via GitHub Actions

## Getting started

Requires Node 20+ (CI uses Node 22).

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript only
```

## Trying the demo

On first launch you land on **Welcome**:

- **Create your profile** walks through onboarding (19 short steps and a preview).
- **Explore with the demo profile** skips straight in as *Alex*, with matches, likes and a planned date ready to try.

A good tour: Discover → open a pick → like a specific answer with a message → **Likes** → match with Sofia → **Matches** → chat (drafts, emoji, photo/voice placeholders) → accept Maja's date and **Share date** → **Profile → Settings** (filters, privacy, verification, safety). Use the developer panel (below) to reach states that would otherwise take days, like a quiet chat or a finished date.

## How the data works

- Everything lives in `localStorage` under keys starting with `dp:` (see `src/storage/keys.ts`). Each value is stored as `{ v, data }` with a version per key.
- The database has a schema version (`DB_SCHEMA_VERSION` in `src/repositories/local/localDb.ts`). Older stored data is migrated, keeping the user's own profile and history, rather than wiped.
- Every stored record is shape-checked on read (`src/repositories/local/guards.ts`). Malformed records are skipped, and an unusable account resets to a fresh start instead of crashing.
- Seed data (`src/data/mock/`) includes about 30 fictional people. Likes, matches and conversations are generated around *your* profile after onboarding (or for the demo user), so likes point at your real photos and prompts.
- Screens never touch storage directly. They call async repositories (`src/repositories/types.ts`), so a real backend (e.g. Supabase) can replace `src/repositories/local/` without UI changes.
- If something ever breaks, the error screen offers **Reset demo data**.

## Developer panel (testing tools)

The panel is hidden from normal use. Open `#/debug`, or tap the version line at the bottom of **Profile** five times quickly. It provides:

- **Build and data:** schema version, live safe-area values, every stored key (expandable).
- **Account & onboarding:** load the demo user, restart onboarding, prefill onboarding with Alex.
- **Likes, matches & messages:** create an incoming like (with or without a comment), force a mutual match, simulate a reply (unread), make the latest chat quiet (*Still interested?*) or inactive, and reset conversations.
- **Account states, safety & dates:** toggle **Free / Premium**, paused, incognito, photo and ID verification. Have your match suggest or accept a date, simulate a completed date (post-date feedback), unblock everyone, clear reports.
- **Recommendations:** every candidate's score breakdown, the soft preferences matched or missed, and every hard filter checked. Regenerate today's picks or reset likes and passes. Scores are never shown to normal users.
- **Reset:** reset all demo data, or clear everything.

## Features

- **Onboarding and profile:** multi-step onboarding with saved progress, 3–6 photos (reorder, replace, delete), 2–3 prompts, 5–10 interests, per-field "show on profile", and editing via the same steps.
- **Discovery:** *Today's picks* is a fixed daily set of up to 12, with plain-language reasons (no percentages). *Explore more* is secondary and never hard-locked. Recommendations are transparent and rules-based: hard filters first, then scoring on intention, distance, age, shared interests, soft preferences, lifestyle fit, activity and profile depth.
- **Contextual likes:** like a specific photo or prompt answer, optionally with a message. Liking the whole profile still works.
- **Likes and matching:** see who liked you (never blurred) and what they liked, then match or pass. Mutual likes show a calm "It's mutual." screen, and like comments carry into the chat.
- **Messaging:** text, emoji, photo and voice-note placeholders, saved drafts, and private unread state. No read receipts, online status or typing indicators.
- **Quiet chats:** matches never expire. After 5 quiet days a chat asks *Still interested?*; after 14 it moves to Inactive. Archiving is always recoverable.
- **Filters:** age, distance, intention, children, wants children, smoking, drinking, religion, politics, height and education. Each is either a **preference** (ranks higher) or a **dealbreaker** (excludes).
- **Privacy:** incognito, pause, hide distance, per-field visibility, and a hide-from-contacts demo.
- **Safety, free for everyone:** report (8 categories), block and unmatch from any profile or chat. Nobody is told who reported or blocked them.
- **Verification (mock):** a photo and ID badge, with copy that's clear verification isn't a safety guarantee.
- **Dates:** plan a date in an established chat, accept or suggest a change, Share date with someone you trust, and give private post-date feedback.
- **Settings:** account and plan, filters, privacy, safety, blocked users, archived matches, appearance, a notifications placeholder, data download (JSON) and delete account.
- **Free vs Premium:** exactly two plans. Free is a complete dating experience. Premium currently only adds a one-step **rewind** of your last pass or like. See *Architecture notes*.

## Architecture notes

```
src/
  app/            App root, router (some screens load on demand), navigation, error boundary
  config/         brand.ts: name, tagline, storage namespace (rename the app here)
  design/         tokens.css (colours, spacing, radii, type, shadows, motion), base.css
  theme/          light / dark / system
  session/        signed-in account; useAccount (plan, pause, incognito, verification)
  onboarding/     draft model, validation, persisted draft
  discovery/      DiscoveryProvider: picks, likes, passes, rewind buffer
  connections/    ConnectionsProvider: likes received, matches, messages, dates, safety; drafts
  recommendation/ hard filters, scoring, compatibility, daily picks (pure functions)
  domain/         types, options, entitlements (Free/Premium), matching and date rules
  repositories/   interfaces + localStorage implementation (+ debug tools, guards)
  components/     ui, form, layout, profile, discovery, connections, safety, dates, brand
  screens/        onboarding, discover, likes, matches, profile, settings, debug, system
  data/mock/      fictional seed data
```

- **Plans:** `src/domain/entitlements.ts` is the single source of truth for Free vs Premium. Only `rewind` is gated. Profiles, discovery, matching, messaging, dealbreakers and every safety tool must stay free. There are no consumables or paid visibility. Payments aren't implemented.
- **Rewind:** `DailyPicks.lastAction` holds exactly one previous pass or like. Every new action replaces it, a rewind clears it, and a like that became a match can't be rewound. It's recorded for everyone and usable only on Premium.
- **Blocking** is enforced in the repositories, so blocked people disappear from every list. A real backend should enforce it server-side too.
- **Privacy rule:** hidden profile fields are never used in compatibility text. For a dealbreaker, a hidden answer counts as "can't confirm" and excludes.
- **Brand:** the name, colours and logo are centralised (`config/brand.ts`, the Brand section of `tokens.css`, `components/brand/Logo.tsx`).

## Deploying to GitHub Pages

1. One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually. `.github/workflows/deploy.yml` runs `npm ci` and `npm run build` with `BASE_PATH=/<repository-name>/`, then publishes `dist/`.
3. The site is served at `https://<user>.github.io/<repository-name>/` (for this repo, `/dating-prototype/`).

Routing uses hashes (`/#/discover`), so refreshing or opening any screen directly works without server rewrites. Local builds without `BASE_PATH` use relative asset paths, which also work from any folder.

## Known limitations

- No backend, authentication, payments, real verification, contact matching, notifications or emergency-service integration. These are mocked or shown as placeholders.
- Photo and voice messages are placeholders, and uploaded profile photos are resized and stored in `localStorage` (a few MB at most).
- Location uses a short list of cities with approximate coordinates.
- Data is per browser; clearing site data resets the demo.
