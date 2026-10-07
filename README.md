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

## Hidden developer panel

Open `#/debug`, or tap the version line at the bottom of **Profile** five times quickly.
It shows build/data info, live safe-area values, theme controls and every stored key, plus actions to
load the demo user, restart onboarding, prefill onboarding with Alex, and reset all demo data.

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
  components/
    ui/           Button, Chip, Card, PhotoFrame, ListRow, EmptyState, Skeleton, BottomSheet…
    form/         TextField, ChoiceList, ChipSelect, Switch, VisibilityToggle, RangeField, ModeToggle
    layout/       AppShell, BottomNav (rail on desktop), Screen, Section
    profile/      ProfileView (full vertical profile), ProfileHeroCard, PromptCard
    brand/        Logo
  screens/        onboarding (welcome, steps, preview), discover, likes, matches,
                  profile (tab, edit, preview), debug, system (gate, 404, route error)
  domain/         Types, intents, interests, profile options (prompts, limits…), cities
  data/mock/      Seed data
  repositories/   Async repository interfaces + localStorage implementation
  storage/        Versioned, namespaced localStorage wrapper + useStoredState hook
  recommendation/ Ranking logic (placeholder until Part 3)
  hooks/ utils/
```
