# Dating App Build Plan

## PART 1 OF 6: Foundation + product direction

You are the lead product designer and senior full-stack engineer for a new dating app prototype.

I want you to DESIGN AND BUILD the prototype, not merely describe it.

This is PART 1 of a multi-part build instruction. Complete this part first. Do not attempt to invent future requirements. I will send the next part afterward.

The goal is not to clone Tinder, Hinge, Bumble, or any existing dating app.

We are taking the strongest interaction patterns from successful dating apps, removing manipulative or gamified bullshit, simplifying the experience, and creating a dating product that feels premium, intentional, modern, safe, and actually designed to help people meet.

PRODUCT PHILOSOPHY

Optimize for:

1. Quality of matches over raw number of matches.
2. Personality and compatibility without turning dating into a personality test.
3. Making it easy to start an actual conversation.
4. Making intentions clear.
5. Reducing swipe fatigue.
6. Giving users meaningful privacy and safety controls.
7. Moving people from app -> conversation -> real-world date.
8. A beautiful, fast mobile experience.
9. No casino mechanics.
10. No artificial frustration designed only to sell premium features.

This is a prototype first.

Do NOT prematurely build complex production infrastructure.

TECH STACK

If the repository is empty, initialize the project yourself.

Use:

- React
- TypeScript
- Vite
- modern CSS architecture or Tailwind if appropriate
- reusable components
- local/mock data
- localStorage where useful so actions survive reloads

Do not require a backend yet.

Architect the app so local/mock repositories can later be replaced by a real backend such as Supabase without rewriting the UI.

The app should be designed mobile-first and feel excellent at modern iPhone dimensions.

It should also respond properly on desktop.

Make sensible senior-engineer decisions without asking me to choose between endless libraries and implementation options.

GITHUB PAGES DEPLOYMENT

This prototype will initially be hosted on GitHub Pages.

Therefore:

- The app must work correctly as a static site.
- Use routing that is compatible with GitHub Pages without requiring server-side rewrites.
- Prefer HashRouter for the prototype unless there is a compelling reason not to.
- Configure Vite so built assets work correctly from a GitHub Pages repository path.
- Add a GitHub Actions workflow that builds and deploys the app to GitHub Pages.
- Do not introduce backend dependencies yet.
- All prototype state should remain local/mock-based for now.

WORKING PRODUCT

Use a temporary app name for now.

Keep all branding centralized so the name, logo, colors and other identity elements can easily be changed later.

This is primarily a relationship-oriented dating app, but users can explicitly choose their dating intention.

Supported intentions:

- Long-term relationship
- Long-term, open to short
- Short-term, open to long
- Casual dating
- Still figuring it out

Do not hide intentions behind vague wording.

The key product idea:

Users should not feel like they are shopping through an infinite catalogue of human faces.

Profiles need enough personality and context that people can actually understand who they are considering.

Discovery should feel intentional and curated rather than endless.

CORE NAVIGATION

Use a mobile bottom navigation with only four primary sections:

1. Discover
2. Likes
3. Matches
4. Profile

Do not create unnecessary extra tabs.

VISUAL DIRECTION

The app should look like a real premium consumer product.

Not:

- a developer dashboard
- a Bootstrap demo
- a Tinder clone
- a crypto app
- a generic purple startup
- excessive glassmorphism
- neon everywhere
- giant glowing buttons
- cartoon hearts everywhere

Design direction:

- clean
- elegant
- warm
- modern
- slightly romantic without being cheesy
- premium typography
- strong hierarchy
- large photography
- restrained shadows
- rounded surfaces
- generous spacing
- subtle polished motion

Create both light and dark mode.

Use a warm neutral base palette with one distinctive accent color.

Centralize design tokens for:

- colors
- spacing
- border radii
- typography
- shadows
- motion

Respect:

prefers-reduced-motion

Use proper iPhone safe-area handling:

env(safe-area-inset-top)
env(safe-area-inset-bottom)

The bottom navigation must never collide with the iPhone home indicator.

Touch targets should be comfortably sized for mobile.

ARCHITECTURE

Create a clean project structure.

Separate:

- UI components
- screens
- domain models/types
- mock repositories
- recommendation logic
- local persistence/storage
- utilities
- design tokens

Avoid giant components.

Do not create a single enormous app file.

Use strict TypeScript where reasonable.

Use semantic HTML and accessible form controls.

Build graceful empty, loading and error states.

FIRST IMPLEMENTATION TASK

For this first phase, build only the foundation:

1. Initialize the project.
2. Create the design system.
3. Create the app shell.
4. Create mobile bottom navigation.
5. Create light/dark theme support.
6. Create routing/navigation structure.
7. Create reusable layout components.
8. Create placeholder screens for:
   - Discover
   - Likes
   - Matches
   - Profile
9. Create domain types for:
   - User
   - Profile
   - DatingIntent
   - Interest
   - Preferences
   - Match
   - Message
10. Create a small initial mock-data layer.
11. Add localStorage infrastructure for future state persistence.
12. Add a hidden developer/debug route or panel that we can expand later.

The placeholder screens should already look polished and consistent with the final product direction.

Do not leave them as ugly plain text pages.

Do NOT yet build full onboarding, recommendation logic, messaging, safety tools or profile creation.

Those will come in later parts.

When you finish this phase:

- run the app
- fix build errors
- fix console errors
- verify navigation works
- verify light/dark mode works
- verify mobile safe areas work

Then give me:

1. A short explanation of what you built.
2. The folder structure.
3. How to run it locally.
4. Any decisions you made that future phases should preserve.

Do not redesign or restart the project when I send the next part.


## PART 2 OF 6: Onboarding + profile creation

Continue the existing project.

Do NOT restart, redesign, replace the architecture, or remove working features from Part 1.

Build the complete onboarding and profile-creation flow.

ONBOARDING GOAL

The onboarding should feel premium, fast, clear and human.

Avoid giant forms.

Use a multi-step flow with clear progress.

Do not overwhelm the user by asking everything on one screen.

Collect:

- First name
- Date of birth
- Gender
- Who they want to meet
- City/location
- Distance preference
- Hard maximum distance
- Dating intention
- Age preference
- Height
- Job, optional
- Education, optional
- Religion, optional
- Politics, optional
- Smoking
- Drinking
- Whether they have children
- Whether they want children
- Languages
- Interests
- Photos
- Profile prompts
- Optional short bio

DATING INTENTIONS

Support:

- Long-term relationship
- Long-term, open to short
- Short-term, open to long
- Casual dating
- Still figuring it out

Make intentions visible and easy to understand.

PREFERENCES VS DEALBREAKERS

This distinction is extremely important.

A preference means:

"I would prefer this, but I am open."

A dealbreaker means:

"Do not show me people outside this requirement."

For filters such as:

- distance
- age
- smoking
- children
- wants children
- religion
- drinking

allow appropriate fields to be marked as either:

Preference
or
Dealbreaker

Example:

Preferred distance:
30 km

Hard maximum:
60 km

Do not treat every preference as a hard filter.

PROFILE VISIBILITY

For personal profile fields, provide visibility controls.

Example:

Religion:
Christian

Show on profile:
ON / OFF

Do this where appropriate for:

- religion
- politics
- job
- education
- children
- drinking
- smoking
- height

PHOTOS

Require:

minimum 3 photos

Allow:

maximum 6 photos

For prototype purposes:

- support mock/local image upload previews
- allow reordering
- allow deleting/replacing
- store safely in prototype state where practical

Do not build cloud uploads yet.

PROFILE PROMPTS

Require at least 2 prompts.

Allow up to 3.

Create a prompt picker.

Include prompts such as:

- A perfect Sunday looks like...
- Something I'll never shut up about...
- Together we could...
- The quickest way to my heart is...
- I'm weirdly passionate about...
- My ideal first date...
- One thing you should know about me...
- I'll fall for you if...
- A green flag I look for...
- The hill I'll die on...
- My most irrational fear...
- We'll get along if...
- I'm looking for someone who...
- A random fact I love...
- The best way to spend a Friday night...

Prompt answers should have sensible character limits.

INTERESTS

Create a curated interest list.

Include:

Gaming
Movies
Horror
Music
Concerts
Gym
Hiking
Cooking
Travel
Photography
Art
History
Books
Animals
Technology
Football
Motorsport
Faith
Coffee
Food
Nature
Board games
Comedy
Fishing
Cars
Running
Cycling
Swimming
Camping
DIY
Fashion
Anime
Science
Writing

Allow approximately 5-10 selections.

PROFILE PREVIEW

Before completing onboarding, show:

"Preview your profile"

Render the actual profile using the same components that Discover will later use.

The user should be able to go back and edit.

DEMO USER

Create a preconfigured demo user for development.

Use:

Name: Alex
Age: 27
Looking for: Women
Intent: Long-term relationship

Interests:

Gaming
Movies
Gym
History
Technology
Horror

Preferred distance:
30 km

Hard maximum:
60 km

Populate remaining details sensibly.

Allow the demo profile to be edited.

STATE

Persist:

- onboarding completion
- profile
- preferences
- photos
- prompts
- interests
- visibility preferences

Use the existing local storage/state layer.

UX REQUIREMENTS

- Smooth transitions
- Clear validation
- Back button always works
- Do not lose previously entered information
- Good mobile keyboard behavior
- No layout jumps
- Proper iPhone safe areas
- Progress indicator
- Skip optional questions where appropriate

Do not make optional fields feel mandatory.

WHEN FINISHED

Run the project.

Fix errors.

Test the entire onboarding flow from start to finish.

Make sure refreshing the page preserves progress.

Do not build discovery yet.

Summarize:

- what was added
- what state is persisted
- any decisions future phases need to know

Then stop and wait for PART 3.


## PART 3 OF 6: Profiles + discovery + recommendation system

Continue the existing project.

Do not restart or redesign previous work.

Now build the core profile-browsing and discovery experience.

PROFILE DESIGN

Profiles should be rich vertical profiles, not just one giant image.

Structure profiles approximately like:

Photo
Name / age / basic details
Dating intention
Prompt + answer
Photo
Shared interests
Prompt + answer
Lifestyle information
Photo
Compatibility information
Prompt + answer
Remaining photos

The experience should feel closer to a strong Hinge profile than a Tinder card.

MOCK PROFILES

Generate approximately 25 fictional profiles.

Make them believable and varied.

Vary:

- age
- distance
- profession
- dating intention
- religion
- politics
- smoking
- drinking
- children
- wants children
- interests
- personality
- prompt quality
- education
- height

Do not make every person unrealistically perfect.

Use believable fictional names and profile text.

Some profiles should:

- match extremely well
- violate soft preferences
- violate hard dealbreakers
- have only moderate compatibility

Profiles violating hard dealbreakers must not appear in normal discovery.

DISCOVERY MODEL

Do NOT make endless swiping the entire experience.

Create:

TODAY'S PICKS

Show approximately 10-15 curated profiles.

Example copy:

"12 people selected around your preferences"

After that set is viewed, allow:

Explore more

This should feel secondary.

Do not hard-lock the app after the daily set.

RECOMMENDATION LOGIC

Build a transparent rules-based recommendation system.

Score profiles using factors such as:

- dating intention alignment
- hard filters
- soft preferences
- age preference
- distance
- shared interests
- lifestyle compatibility
- activity freshness

Do NOT generate fake percentages like:

"97% compatible"

Instead explain compatibility using human language.

Examples:

"You both want a long-term relationship"

"4 shared interests"

"Neither of you smokes"

"12 km away"

HARD FILTERS

Hard dealbreakers must be applied before scoring.

A profile outside a hard requirement should not appear.

SOFT PREFERENCES

Soft preferences should influence ranking without excluding profiles.

Example:

Preferred distance:
30 km

Hard max:
60 km

Someone 42 km away may still appear but rank lower.

PROFILE COMPATIBILITY SECTION

Show:

SHARED

Gaming
Horror
Cooking

ALIGNED

Long-term relationship
Doesn't smoke
Wants children

DIFFERENT

Night owl / Early bird

Differences should not automatically be shown as negative.

DEBUG MODE

Extend the hidden developer/debug panel.

Allow developers to inspect:

- final recommendation score
- score breakdown
- which soft preferences matched
- which hard filters were checked

This is for development only.

Normal users should never see raw scoring numbers.

DISCOVERY INTERACTIONS

Support:

PASS
LIKE

Optional:

UNDO LAST PASS

Visible controls must exist.

Gesture support may also exist, but gestures cannot be the only way to use the app.

CONTEXTUAL LIKES

Users should be able to like:

- a specific photo
- a specific prompt answer

Each like can optionally include a comment.

Example:

"Like this answer"

Then:

Add a message?

[message field]

Send Like

A simple whole-profile like may exist as fallback.

Contextual likes should be encouraged.

SCROLL POSITION

When opening a profile and returning to discovery:

preserve scroll position.

Do not throw users back to the top.

EMPTY STATES

Example:

"That's everyone in today's recommendations.
We'll have more for you soon."

Use warm, normal language.

No guilt.

WHEN FINISHED

Test:

- hard filters
- soft ranking
- contextual likes
- pass
- undo
- profile scrolling
- refresh persistence
- mobile layout

Fix errors.

Then summarize what was built and wait for PART 4.


## PART 4 OF 6: Likes + matching + messages

Continue the existing project.

Now build the complete likes, matching and messaging experience.

LIKES YOU

Create a Likes screen showing people who liked the current user.

Do NOT blur profiles behind a paywall.

Each incoming like should show:

- photo
- first name
- age
- what part of the profile they liked
- optional comment

Actions:

- View profile
- Match
- Pass

MUTUAL MATCHES

If both users like each other:

create a Match.

Show a tasteful match screen.

Avoid giant confetti explosions.

Example:

"It's mutual."

Show:

their photo
your photo

Then context:

"You liked Emma's travel photo."

"Emma liked your Sunday prompt."

Buttons:

Send a message
Keep browsing

MATCH CONTEXT

If either person sent a comment with their like:

carry that context into the conversation.

Do not make users start from an empty chat if they already exchanged context.

MATCHES TAB

Create a proper list of matches/conversations.

Show:

- profile photo
- first name
- last message preview
- timestamp
- unread state

Order by recent activity.

CHAT

Build functioning chat UI.

Support:

- text
- emoji
- photo-message placeholder
- future voice-note placeholder

Text messages must persist locally.

Do not lose unsent drafts when navigating away.

PROFILE CONTEXT

Inside chat:

allow opening the other person's profile.

Also show subtle conversation context.

For new conversations, show optional conversation hooks.

Example:

"You both like horror movies."

"Ask Emma about Japan."

These are suggestions only.

Do NOT auto-write or auto-send messages.

READ RECEIPTS

Do not enable read receipts by default.

If future support is included in settings, make them optional.

ACTIVITY STATUS

Do not show:

"Online now"

by default.

Activity visibility should be opt-in later.

ANTI-GHOSTING

Do NOT automatically expire matches.

No 24-hour countdown.

No 72-hour destruction timer.

Instead, after several inactive days:

show something subtle like:

"Still interested?"

Options:

Send a message
Keep for later
Archive match

After longer inactivity:

move conversations into:

Inactive

Do not unmatch automatically.

ARCHIVE

Allow:

Archive conversation

Archived chats remain recoverable.

STATE

Persist:

- sent likes
- received likes
- matches
- messages
- drafts
- archived state
- unread state

MOCK INTERACTION

Create enough mock received likes and matches to properly test the feature.

Allow debug controls to:

- force mutual match
- create incoming like
- mark chat inactive
- reset messages

WHEN FINISHED

Test:

- contextual likes
- incoming likes
- mutual match creation
- message persistence
- drafts
- unread state
- archive
- inactive chats
- navigation

Fix all errors.

Then wait for PART 5.


## PART 5 OF 6: Filters + privacy + safety + dates

Continue the existing project.

Now build advanced preferences, privacy controls, safety tools and date planning.

FILTERS

Core filters:

- age
- distance
- gender
- dating intention

Additional filters:

- children
- wants children
- smoking
- drinking
- religion
- politics
- height
- education

Where appropriate:

allow each filter to be either:

Preference

or

Dealbreaker

Do not create endless obscure filters.

PRIVACY

Create a Privacy & Visibility screen.

Include:

INCOGNITO MODE

"When enabled, only people you like can see your profile."

PAUSE PROFILE

"Stop appearing in Discover without deleting matches."

HIDE DISTANCE

Do not show precise GPS location.

Only show approximate distance such as:

"8 km away"

Allow:

Hide distance

Allow users to hide individual profile fields.

CONTACT PRIVACY

Create prototype UI for:

Hide from contacts

Do NOT actually upload contacts yet.

Clearly mark it as prototype behavior.

SAFETY

Create:

- Block
- Report
- Unmatch

Report categories:

- Fake profile
- Harassment
- Sexual/inappropriate content
- Hate or threats
- Underage
- Spam/scam
- Someone I know / privacy concern
- Other

Reporting should feel private and calm.

Never imply the reported person is told who reported them.

VERIFICATION

Prototype:

Photo verified

and optionally:

ID verified

Do not implement real biometric or identity verification yet.

Use fake/mock verification state.

Clearly avoid implying verification guarantees safety.

DATE PLANNING

Inside established conversations:

add a subtle:

Plan a date

flow.

Allow:

- date
- time
- optional venue
- optional note

Create a shared date card.

Example:

Friday
19:00
Coffee at Kajplats 9

Actions:

Accept
Suggest change

SHARE DATE

Create a trusted-contact style safety flow.

Generate a mock share summary containing:

- match first name
- match photo
- planned location
- date
- time

Prototype native share-sheet behavior where possible.

No real emergency-service integration yet.

POST-DATE FEEDBACK

After a planned date has passed:

ask privately:

"How did it go?"

Options:

- I'd like to see them again
- Not sure yet
- Not a match for me
- I didn't go on the date

Optional:

"What worked?"

"What didn't?"

This information must NEVER be shown to the other person.

Store it as mock recommendation feedback.

ACCOUNT STATES

Support:

- Active
- Paused
- Incognito
- Photo verified
- Not verified

Allow toggling these in developer/debug mode.

SETTINGS

Create a clean Settings area containing:

Account
Appearance
Notifications placeholder
Privacy
Safety
Dating preferences
Blocked users
Archived matches
Data/export placeholder
Delete account prototype

Do not overload the screen.

WHEN FINISHED

Test:

- preferences
- dealbreakers
- incognito
- pause
- reports
- blocking
- unmatching
- date planning
- share date
- post-date feedback

Fix all errors.

Then wait for PART 6.


## PART 6 OF 6: Final polish + GitHub Pages + production readiness

Continue the existing project.

This phase is about polish, deployment, accessibility, reliability and final integration.

Do not redesign the entire app.

DO NOT ADD

Do NOT add:

- Super Likes
- Roses
- Boosts
- Spotlight
- coins
- beans
- virtual gifts
- popularity scores
- public match counts
- follower counts
- followers/following
- stories
- livestreams
- social feed
- public comments
- profile ratings
- "hot or not" scoring
- daily streaks
- login rewards
- loot boxes
- artificial match expiry
- forced women-message-first rules
- precise live location
- read receipts by default
- public activity status by default
- AI-generated flirting that sends messages for the user

The app must not feel like:

Instagram
TikTok
a casino
a mobile game

MONETIZATION

Do NOT implement payments yet.

However, keep architecture flexible enough for a future single premium tier.

Potential future premium conveniences may include:

- incognito
- travel mode
- advanced filters
- extended undo history
- additional discovery

Core dating functionality must remain usable without premium.

Do not deliberately degrade matching to force payment.

COPY

Audit all UI text.

Remove robotic or corporate wording.

Avoid:

"Embark on your journey toward meaningful connection."

Prefer:

"Who are you hoping to meet?"

Copy should be:

- warm
- concise
- confident
- human

ACCESSIBILITY

Audit:

- keyboard navigation
- focus states
- semantic HTML
- labels
- contrast
- touch targets
- screen-reader text
- reduced motion
- form errors

Respect:

prefers-reduced-motion

MOBILE POLISH

Test carefully at modern iPhone dimensions.

Verify:

- safe-area top
- safe-area bottom
- home indicator
- keyboard opening
- bottom navigation
- modals
- image viewers
- profile scrolling
- chat input
- onboarding
- dark mode

No content should sit underneath the home indicator.

GITHUB PAGES

Prepare the app for GitHub Pages.

Requirements:

- static deployment
- no backend dependency
- GitHub Pages-compatible routing
- use HashRouter unless existing routing already solves static refresh safely
- configure Vite asset paths correctly
- add GitHub Actions deployment workflow
- production build must succeed
- direct app launch must work from the repository Pages URL

Add clear README instructions covering:

1. npm install
2. npm run dev
3. npm run build
4. GitHub Pages deployment

STATE RELIABILITY

Audit localStorage state.

Ensure malformed or old state does not crash the app.

Add simple schema/version handling if appropriate.

The app should recover gracefully if stored prototype data is invalid.

PERFORMANCE

Audit:

- unnecessary renders
- image loading
- bundle size
- duplicated data
- oversized components

Lazy-load images where appropriate.

Do not over-optimize tiny things.

FINAL DEMO DATA

Ensure the prototype contains enough realistic data to demonstrate:

- discovery
- likes
- contextual likes
- matches
- chats
- inactive conversations
- planned dates
- safety flows
- preference filtering

Add a developer button:

RESET DEMO DATA

FINAL DEBUG PANEL

The hidden debug panel should support:

- reset all demo data
- simulate incoming like
- simulate mutual match
- toggle verification
- toggle incognito
- toggle paused state
- simulate inactive chat
- simulate completed date
- inspect recommendation score breakdown

Keep this hidden from normal navigation.

FINAL QUALITY PASS

Go through every major screen and interaction.

Fix:

- broken buttons
- dead navigation
- visual inconsistencies
- overflow
- mobile layout problems
- missing empty states
- console errors
- TypeScript errors
- build errors

Run:

npm run build

The final build must succeed.

FINAL REPORT

When everything is finished, give me:

1. A concise explanation of the app architecture.
2. Folder structure.
3. Full list of functional features.
4. What remains mocked.
5. What would be required for a real backend.
6. What would be required for real authentication.
7. What would be required for real photo storage.
8. What would be required for real messaging.
9. What would be required for real verification.
10. What would be required for App Store / Play Store deployment.
11. The five highest-value improvements from here.
12. Exact local development commands.
13. Exact GitHub Pages deployment process.

Do not merely describe future work.

Finish and test the prototype first.
