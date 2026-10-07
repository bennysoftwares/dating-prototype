# Dating Prototype

A mobile-first dating app prototype (temporary name). React + TypeScript + Vite, fully static, with all data stored locally on the device.

See `BUILD_PLAN.md` for the product direction and phased build plan.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript only
```

## First launch

A fresh account starts at the Welcome screen:

- **Create your profile**: the full onboarding flow (19 short steps + a profile preview). Progress is saved on every change, so refreshing or closing the tab never loses answers.
- **Explore with the demo profile**: skips onboarding with the preconfigured demo user (Alex).

After onboarding, **Profile → Edit profile** reopens any answer using the same step screens.

## Discovery

**Discover** shows *Today's picks*: a small curated set (up to 12) chosen around your preferences, each with plain-language reasons (“You both want a long-term relationship”, “4 shared interests”, “12 km away”). There are no percentages or scores.

- Open a pick to read the full profile. Like a specific photo or prompt answer (optionally with a message), like the whole profile, or pass. Undo is available for your last pass (one step).
- Once today's set has been seen, **Explore more** shows the remaining eligible people. It's never hard-locked.
- Recommendations live in `src/recommendation/` as pure functions: hard filters (who you want to meet, hard max distance, dealbreakers) run first and exclude; then a transparent score ranks people on intention, distance, age, shared interests, soft preferences, lifestyle fit, recent activity and profile depth.
- Hidden profile fields are never used in compatibility text. For a dealbreaker, a hidden answer counts as “can't confirm” and excludes.

## Likes, matches and messages

- **Likes** shows everyone who liked you, never blurred: their photo, name, age, what they liked (a photo, a prompt answer or your profile) and any comment. Match, pass, or open their full profile.
- A like in either direction that meets one from the other person makes a **match**. The match screen (“It's mutual.”) shows both photos and what each of you liked.
- **Like comments carry into the chat** as the first messages, quoting what was liked, so nobody starts from an empty conversation. New chats also show a few optional conversation ideas. Nothing is ever written or sent for you.
- **Matches** lists new matches, conversations by recent activity (photo, name, last message or draft, time, unread state), a collapsed **Inactive** section and **Archived** chats.
- **Chat** supports text, emoji, a photo-message placeholder and a voice-note placeholder. Drafts are saved per conversation on every keystroke.
- No read receipts, no online/active status, no typing indicators. Unread state is private to you.
- **Matches never expire.** After 5 quiet days a chat asks “Still interested?” (Send a message / Keep for later / Archive). After 14 days it moves to Inactive. Nothing is unmatched automatically, and archived chats are always recoverable.

## Hidden developer panel

Open `#/debug`, or tap the version line at the bottom of **Profile** five times quickly.
It shows build/data info, live safe-area values, theme controls and every stored key, plus actions to
load the demo user, restart onboarding, prefill onboarding with Alex, and reset all demo data.
The **Recommendations** section shows every candidate's final score, score breakdown, soft
preferences matched/missed, and every hard filter checked, with actions to regenerate today's picks
or reset likes and passes.
The **Likes, matches & messages** section simulates the other person: create an incoming like (with or
without a comment), force a mutual match, simulate a reply (unread), make the latest chat quiet
(Still interested?) or inactive, and reset conversations.

## GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on every push to `main` (or run it manually from the Actions tab).
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build uses relative asset paths (`base: './'`) and hash routing (`/#/discover`), so it works from any repository path and survives refreshes with no server rewrites.

## Project structure

```
src/
  app/            App root, router, navigation config
  config/         brand.ts: app name, tagline, storage namespace
  design/         tokens.css (all colours/spacing/radii/type/shadows/motion), base.css
  theme/          Light/dark/system theme provider
  session/        Signed-in account (decides onboarding vs. app)
  onboarding/     Draft model, validation, persisted draft hook
  discovery/      DiscoveryProvider: today's picks, likes, passes, one-step undo
  connections/    ConnectionsProvider: likes received, matches, messages, unread; drafts
  components/
    ui/           Button, Chip, Card, PhotoFrame, ListRow, EmptyState, Skeleton, BottomSheet…
    form/         TextField, ChoiceList, ChipSelect, Switch, VisibilityToggle, RangeField, ModeToggle
    layout/       AppShell, BottomNav (rail on desktop), Screen, Section
    profile/      ProfileView (full vertical profile), ProfileHeroCard, PromptCard
    discovery/    PickCard, LikeButton, LikeSheet, CompatibilitySection
    connections/  ConversationRow, MessageBubble, Composer, LikedSnapshot
    brand/        Logo
  screens/        onboarding (welcome, steps, preview), discover (picks, profile),
                  likes (list, liker profile), matches (list, archived, chat, match screen),
                  profile (tab, edit, preview), debug, system (gate, 404, route error)
  domain/         Types, intents, interests, profile options, cities, matching rules, conversation ideas
  data/mock/      Seed data
  repositories/   Async repository interfaces + localStorage implementation
  storage/        Versioned, namespaced localStorage wrapper + useStoredState hook
  recommendation/ Hard filters, scoring, compatibility, daily picks (pure functions)
  hooks/ utils/
```
