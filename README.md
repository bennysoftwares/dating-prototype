# TurtleDoves

A warm, relationship-focused, mobile-first dating app **prototype**. It's built around one journey:

**find → understand → match → talk → meet**

Explore is photo-first: swipe right to like, left to pass, one person at a time, until you've genuinely seen everyone who fits your distance and filters. Every card opens a full, structured profile with prompts and details, so you can understand someone before you match. Safety tools are free for everyone. There are no games, streaks, coins, boosts, Super Likes, popularity scores or match expiry.

This is a front-end prototype: there is **no backend, no real accounts and no payments**. All data is fictional and stored in your browser.

## Tech stack

- React 19 + TypeScript (strict) + Vite
- React Router (hash routing) for static hosting
- Plain CSS with design tokens (`src/design/tokens.css`), light and dark themes
- Self-hosted fonts (Newsreader for the wordmark, names and headings; DM Sans for everything else)
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

A good tour: **Explore** → swipe a few people (or use ✕ and ♥) → tap a card's info to open the full profile → like a specific answer with a message → **Standouts** → **Likes** → match with Sofia → **Chats** → chat (drafts, emoji, photo/voice placeholders) → accept Maja's date and **Share date** → **Explore → sliders icon** (Discovery settings) → change the max distance and watch Explore refill. Toggle **Premium** in the developer panel to try the top-right undo. Use the developer panel (below) to reach states that would otherwise take days, like a quiet chat or a finished date.

## How the data works

- Everything lives in `localStorage` under keys starting with `dp:` (see `src/storage/keys.ts`). Each value is stored as `{ v, data }` with a version per key.
- The database has a schema version (`DB_SCHEMA_VERSION` in `src/repositories/local/localDb.ts`). Older stored data is migrated, keeping the user's own profile and history, rather than wiped.
- Every stored record is shape-checked on read (`src/repositories/local/guards.ts`). Malformed records are skipped, and an unusable account resets to a fresh start instead of crashing.
- Seed data (`src/data/mock/`) has a hand-written cast of about 30 fictional people, plus ~300 more generated deterministically (`generated.ts`): most around Gothenburg at distances from 1 to 150 km, and a handful near every city you can pick during onboarding. Likes, matches and conversations are generated around *your* profile after onboarding (or for the demo user), so likes point at your real photos and prompts.
- Mock photos are generated placeholder art in warm tones (a soft portrait or landscape scene; small frames show an initial). Your own uploaded photos are real images.
- Screens never touch storage directly. They call async repositories (`src/repositories/types.ts`), so a real backend (e.g. Supabase) can replace `src/repositories/local/` without UI changes.
- If something ever breaks, the error screen offers **Reset demo data**.

## Developer panel (testing tools)

The panel is hidden from normal use. Open `#/debug`, or tap the version line at the bottom of **Profile** five times quickly. It provides:

- **Build and data:** schema version, live safe-area values, every stored key (expandable).
- **Account & onboarding:** load the demo user, restart onboarding, prefill onboarding with Alex.
- **Likes, matches & messages:** create an incoming like (with or without a comment), force a mutual match, simulate a reply (unread), make the latest chat quiet (*Still interested?*) or inactive, and reset conversations.
- **Account states, safety & dates:** toggle **Free / Premium**, paused, incognito, photo and ID verification. Have your match suggest or accept a date, simulate a completed date (post-date feedback), unblock everyone, clear reports.
- **Recommendations:** every candidate's score breakdown, the soft preferences matched or missed, and every hard filter checked. Regenerate today's Standouts or reset likes and passes (Explore refills). Scores are never shown to normal users.
- **Reset:** reset all demo data, or clear everything.

## Features

- **Splash:** an instant, responsive TurtleDoves splash (doves and wordmark) painted straight from `index.html` before any JavaScript loads, sized from the viewport and safe areas rather than a fixed screenshot.
- **Onboarding and profile:** multi-step onboarding with saved progress, 3–6 photos (reorder, replace, delete), 2–3 prompts, 5–10 interests, per-field "show on profile", and editing via the same steps.
- **Explore (swipe feed):** one person at a time. Drag the card: it follows your finger with a slight tilt and a soft like/pass cue, snaps back if you let go early, and flies off once past the threshold (or with a quick flick). **✕ = swipe left = pass. ♥ = swipe right = like.** The arrow keys do the same. Tap the left or right of the photo to change photos. Tap the name and details (or the ⌃ button) and the card opens in place into the full profile: the photo on top, then *Looking for*, *About me*, *The basics*, each prompt, lifestyle, interests and compatibility, each with a **Reply** (a like with an optional message on that part), plus Block and Report. ✕ and ♥ float at the bottom and act exactly like swiping; the ⌄ button (or the back gesture) folds it back into the card. Pages of people load in the background before the queue runs low, so swiping is continuous until there's genuinely nobody left within your distance and filters. Then you see *You've seen everyone nearby.* with one-tap ways to widen distance or age.
- **Sorts:** *For You* (compatibility), *Nearby* (closest first) and *Standouts* (today's curated set), all on the same deck.
- **Undo (Premium):** the top-right undo brings back your last pass or like, one step only. Free has no undo.
- **Full profile:** the same full-screen layout whether opened from an Explore card or from Standouts: photo carousel, sections with Reply, interests (shared ones first), lifestyle, plain-language compatibility, and Block / Report.
- **Standouts:** a small set picked each day on compatibility (never payment or popularity), shown as an editorial photo grid.
- **Contextual likes:** like a specific photo or prompt answer, optionally with a message. Liking the whole profile still works.
- **Likes and matching:** see who liked you (never blurred, never paywalled) and what they liked, then match or pass. Mutual likes show a calm "It's mutual." screen, and like comments carry into the chat.
- **Chats:** search by name, new matches, unread counts, drafts, text, emoji, and photo and voice-note placeholders. No read receipts, online status or typing indicators.
- **Quiet chats:** matches never expire. After 5 quiet days a chat asks *Still interested?*; after 14 it moves to Inactive. Archiving is always recoverable.
- **Discovery settings:** location, max distance, interested in, age range (with an "only show this range" switch), relationship goals, verified profiles only, has a bio, minimum photos, plus preferred distance, children, wants children, smoking, drinking, religion, politics, height and education. List filters are either a **preference** (ranks higher) or a **dealbreaker** (excludes). Changes apply to Explore straight away.
- **Privacy:** incognito, pause, hide distance, per-field visibility, and a hide-from-contacts demo.
- **Safety, free for everyone:** report (8 categories), block and unmatch from any profile or chat. Nobody is told who reported or blocked them.
- **Verification (mock):** a photo and ID badge, with copy that's clear verification isn't a safety guarantee.
- **Dates:** plan a date in an established chat, accept or suggest a change, Share date with someone you trust, and give private post-date feedback.
- **Settings:** account and plan, discovery settings, privacy, safety, blocked users, archived matches, appearance, a notifications placeholder, data download (JSON) and delete account.
- **Free vs Premium:** exactly two plans. Free is a complete dating experience. Premium currently only adds the one-step **undo**. See *Architecture notes*.

## Architecture notes

```
src/
  app/            App root, router (some screens load on demand), navigation, error boundary
  config/         brand.ts: name, tagline, storage namespace (rename the app here)
  design/         tokens.css (TurtleDoves palette, spacing, radii, type, shadows, motion), base.css
  theme/          light / dark / system
  session/        signed-in account; useAccount (plan, pause, incognito, verification)
  onboarding/     draft model, validation, persisted draft
  discovery/      DiscoveryProvider: Explore queue (paged), Standouts, likes, passes, rewind buffer
  connections/    ConnectionsProvider: likes received, matches, messages, dates, safety; drafts
  recommendation/ hard filters, scoring, compatibility, daily picks (pure functions)
  domain/         types, options, entitlements (Free/Premium), matching and date rules
  repositories/   interfaces + localStorage implementation (+ debug tools, guards)
  components/     ui, form, layout, explore (SwipeDeck, ProfileCard, ActionButtons), profile,
                  discovery, connections, safety, dates, brand (dove mark + outlined wordmark)
  screens/        onboarding, explore, standouts, likes, matches (Chats), profile, settings, debug, system
  data/mock/      fictional seed data
```

- **Plans:** `src/domain/entitlements.ts` is the single source of truth for Free vs Premium. Only `rewind` is gated. Profiles, discovery, matching, messaging, dealbreakers and every safety tool must stay free. There are no consumables or paid visibility. Payments aren't implemented.
- **Explore feed:** `DiscoveryRepository.getFeedPage({ sort, limit, exclude })` returns one page of eligible, undecided people (hard filters applied; liked, passed, matched and blocked people left out). The client passes the people it already has queued as `exclude`, so pages never repeat, and asks for the next page when 4 or fewer remain. `hasMore: false` with an empty queue is the only "seen everyone" signal. A real backend would implement the same contract server-side.
- **One decision path:** swipe gestures (touch, pen or mouse, via Pointer Events), the ✕ / ♥ buttons, arrow keys and the opened profile's buttons all call the same `pass` / `like` in `DiscoveryProvider`. Decisions are optimistic (the card leaves at once) and save in parallel; each gets a sequence number and only the newest may write the rewind buffer, so a slow save can never overwrite a newer one.
- **Opening a card in place:** `?profile=<id>` on `#/explore` opens the profile over the deck (a history entry, so back closes it). Where supported, the photo and name morph between card and profile with the View Transitions API; elsewhere it slides up.
- **Rewind:** `DailyPicks.lastAction` holds exactly one previous pass or like. Every new action replaces it, a rewind clears it, and a like that became a match can't be rewound. It's recorded for everyone and usable only on Premium.
- **Blocking** is enforced in the repositories, so blocked people disappear from every list. A real backend should enforce it server-side too.
- **Privacy rule:** hidden profile fields are never used in compatibility text. For a dealbreaker, a hidden answer counts as "can't confirm" and excludes.
- **Brand:** the name, colours and logo are centralised (`config/brand.ts`, the Brand section of `tokens.css`, `components/brand/Logo.tsx` and `wordmark.ts`). The splash in `index.html` inlines the same artwork. The storage namespace stays `dp` on purpose, so existing saved data keeps working.
- **Routes:** `/explore`, `/standouts`, `/likes`, `/chats`, `/profile`. The old `/discover` and `/matches` links redirect.

## Deploying to GitHub Pages

1. One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually. `.github/workflows/deploy.yml` runs `npm ci` and `npm run build` with `BASE_PATH=/<repository-name>/`, then publishes `dist/`.
3. The site is served at `https://<user>.github.io/<repository-name>/` (for this repo, `/dating-prototype/`).

Routing uses hashes (`/#/discover`), so refreshing or opening any screen directly works without server rewrites. Local builds without `BASE_PATH` use relative asset paths, which also work from any folder.

## Known limitations

- No backend, authentication, payments, real verification, contact matching, notifications or emergency-service integration. These are mocked or shown as placeholders.
- Photo and voice messages are placeholders, and uploaded profile photos are resized and stored in `localStorage` (a few MB at most). Mock people use generated placeholder art, not real photos.
- Online status isn't shown because the app has no presence system (by design, nothing fakes it).
- "Pages" of people come from the local repository, so loading more is instant apart from a small simulated delay.
- Location uses a short list of cities with approximate coordinates.
- Data is per browser; clearing site data resets the demo.
