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

## Hidden developer panel

Open `#/debug`, or tap the version line at the bottom of **Profile** five times quickly.
It shows build/data info, live safe-area values, theme controls, every stored key, and has "Reset demo data".

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
  components/
    ui/           Button, Chip, Card, PhotoFrame, ListRow, EmptyState, Skeleton…
    layout/       AppShell, BottomNav (rail on desktop), Screen, Section
    profile/      ProfileHeroCard, PromptCard (shared by Discover and Profile)
    brand/        Logo
  screens/        discover, likes, matches, profile, debug, system (404, route error)
  domain/         Types: User, Profile, Preferences, Match, Message; intents; interests
  data/mock/      Seed data
  repositories/   Async repository interfaces + localStorage implementation
  storage/        Versioned, namespaced localStorage wrapper + useStoredState hook
  recommendation/ Ranking logic (placeholder until Part 3)
  hooks/ utils/
```
