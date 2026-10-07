import type { ApproxLocation, Photo, Profile } from '../../domain/types';
import { daysAgo, hoursAgo } from '../../utils/time';
import { TONES } from './tones';

const GOTHENBURG = { city: 'Gothenburg', country: 'Sweden', lat: 57.71, lng: 11.97 };

function photos(profileId: string, name: string, tones: Array<readonly [string, string]>): Photo[] {
  return tones.map((tone, i) => ({ id: `${profileId}-p${i + 1}`, tone, alt: `Photo ${i + 1} of ${name}` }));
}

export const CURRENT_USER_ID = 'u-me';
export const CURRENT_PROFILE_ID = 'p-me';

/** Preconfigured demo user (Alex) for development. Fully editable once loaded. */
export function createDemoProfile(now: string): Profile {
  return {
    id: CURRENT_PROFILE_ID,
    userId: CURRENT_USER_ID,
    firstName: 'Alex',
    birthDate: '1999-03-14',
    gender: 'man',
    intent: 'long_term',
    location: GOTHENBURG,
    heightCm: 182,
    job: 'Software engineer',
    education: 'MSc Computer Science',
    smoking: 'never',
    drinking: 'socially',
    children: 'none',
    wantsChildren: 'wants',
    languages: ['English', 'Swedish'],
    interests: ['gaming', 'movies', 'gym', 'history', 'technology', 'horror'],
    religion: 'Agnostic',
    politics: 'Moderate',
    photos: photos('p-me-demo', 'Alex', [TONES.sea, TONES.stone, TONES.sand, TONES.sage]),
    prompts: [
      { id: 'p-me-q1', prompt: 'A perfect Sunday looks like...', answer: 'Long gym session, a slow brunch, then a horror double feature with someone who pretends not to be scared.' },
      { id: 'p-me-q2', prompt: "I'm weirdly passionate about...", answer: 'Medieval siege engineering. Ask me about trebuchets at your own risk.' },
      { id: 'p-me-q3', prompt: 'My ideal first date...', answer: 'Coffee somewhere quiet, then a walk that accidentally turns into dinner.' },
    ],
    bio: 'Builds software by day, loses at strategy games by night.',
    visibility: { job: true, education: true, height: true, drinking: true, smoking: true, children: true, religion: false, politics: false },
    updatedAt: now,
  };
}

type Tone = readonly [string, string];

/** Nearby places, rounded to ~1 km. Distances are from central Gothenburg. */
const PLACES = {
  haga: { ...GOTHENBURG, lat: 57.7, lng: 11.95 },
  majorna: { ...GOTHENBURG, lat: 57.69, lng: 11.92 },
  hisingen: { ...GOTHENBURG, lat: 57.74, lng: 11.94 },
  johanneberg: { ...GOTHENBURG, lat: 57.69, lng: 11.98 },
  molndal: { city: 'Mölndal', country: 'Sweden', lat: 57.66, lng: 12.01 },
  lerum: { city: 'Lerum', country: 'Sweden', lat: 57.77, lng: 12.27 },
  kungalv: { city: 'Kungälv', country: 'Sweden', lat: 57.87, lng: 11.98 },
  kungsbacka: { city: 'Kungsbacka', country: 'Sweden', lat: 57.49, lng: 12.08 },
  stenungsund: { city: 'Stenungsund', country: 'Sweden', lat: 58.07, lng: 11.82 },
  alingsas: { city: 'Alingsås', country: 'Sweden', lat: 57.93, lng: 12.53 },
  boras: { city: 'Borås', country: 'Sweden', lat: 57.72, lng: 12.94 },
  trollhattan: { city: 'Trollhättan', country: 'Sweden', lat: 58.28, lng: 12.29 },
  stockholm: { city: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07 },
} satisfies Record<string, ApproxLocation>;

type Seed = Omit<Profile, 'id' | 'userId' | 'photos' | 'prompts' | 'visibility' | 'updatedAt' | 'lastActiveAt'> & {
  key: string;
  tones: Tone[];
  prompts: Array<[string, string]>;
  visibility?: Profile['visibility'];
  /** Hours since last active. */
  activeHoursAgo: number;
};

function build(seed: Seed, now: number): Profile {
  const { key, tones, prompts, activeHoursAgo, visibility, ...rest } = seed;
  const id = `p-${key}`;
  return {
    ...rest,
    id,
    userId: `u-${key}`,
    photos: photos(id, seed.firstName, tones),
    prompts: prompts.map(([prompt, answer], i) => ({ id: `${id}-q${i + 1}`, prompt, answer })),
    visibility: visibility ?? { job: true, education: true, height: true, drinking: true, smoking: true, children: true, religion: true, politics: true },
    updatedAt: daysAgo(3, now),
    lastActiveAt: hoursAgo(activeHoursAgo, now),
  };
}

const T = TONES;

/**
 * ~28 fictional people, deliberately varied. Seen from the demo user (Alex: man, 27,
 * Gothenburg, long-term, wants women 23–32, 30 km preferred / 60 km max, smoking dealbreaker):
 * - strong matches (Ida, Elin, Alice, Hanna)
 * - soft-preference misses that still appear lower down (Sara 34, Klara 22, Wilma 42 km, Elsa 33)
 * - moderate fits (Ebba: casual, Tove: inactive, Nadia: sparse profile)
 * - hard dealbreaker failures that never appear (Julia/Johanna/Nora smoke, Amanda/Matilda too far, men)
 * Emma, Maja and Lina are already matches, so they're excluded from discovery too.
 */
const SEEDS: Seed[] = [
  {
    key: 'emma', firstName: 'Emma', birthDate: '1998-07-02', gender: 'woman', intent: 'long_term', location: PLACES.haga, heightCm: 168,
    job: 'Architect', education: 'Chalmers', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English', 'Japanese'], interests: ['travel', 'horror', 'cooking', 'art', 'movies'], tones: [T.clay, T.sand, T.dusk],
    prompts: [
      ['My ideal first date...', 'A walk through Haga, coffee that turns into dinner, and an argument about the best Studio Ghibli film.'],
      ['A random fact I love...', 'Kyoto has over 1,600 temples. I have been to 41 so far.'],
    ],
    activeHoursAgo: 1,
  },
  {
    key: 'sofia', firstName: 'Sofia', birthDate: '1996-11-21', gender: 'woman', intent: 'long_term_open_short', location: PLACES.hisingen, heightCm: 171,
    job: 'Nurse', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'open', languages: ['Swedish', 'English', 'Spanish'],
    interests: ['hiking', 'nature', 'coffee', 'books', 'animals'], tones: [T.sage, T.stone, T.sea],
    prompts: [
      ['The quickest way to my heart is...', 'Remembering how I take my coffee. Oat milk, no sugar, a little too hot.'],
      ['A green flag I look for...', 'You are kind to waiters and you text back when you said you would.'],
    ],
    bio: 'Night shifts, early hikes, and a dog who thinks he runs the house.',
    activeHoursAgo: 6,
  },
  {
    key: 'maja', firstName: 'Maja', birthDate: '2000-02-09', gender: 'woman', intent: 'figuring_out', location: PLACES.majorna, heightCm: 163,
    job: 'Game designer', education: 'University West', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'unsure',
    languages: ['Swedish', 'English'], interests: ['gaming', 'anime', 'board_games', 'technology', 'comedy'], tones: [T.plum, T.ember, T.dusk],
    prompts: [
      ["The hill I'll die on...", 'Co-op games are the best relationship test ever invented.'],
      ["We'll get along if...", 'You can lose at Mario Kart gracefully. Or at least entertainingly.'],
    ],
    activeHoursAgo: 5,
  },
  {
    key: 'lina', firstName: 'Lina', birthDate: '1995-05-30', gender: 'woman', intent: 'long_term', location: PLACES.molndal, heightCm: 175,
    job: 'History teacher', education: 'University of Gothenburg', religion: 'Christian', smoking: 'never', drinking: 'rarely', children: 'none',
    wantsChildren: 'wants', languages: ['Swedish', 'English', 'German'], interests: ['history', 'books', 'faith', 'running', 'music'], tones: [T.sand, T.clay, T.stone],
    prompts: [
      ["Something I'll never shut up about...", 'The Vasa ship. Built to impress, sank in twenty minutes. Relatable.'],
      ["I'm looking for someone who...", 'Asks good questions and actually listens to the answers.'],
    ],
    activeHoursAgo: 140,
  },
  {
    key: 'nora', firstName: 'Nora', birthDate: '1997-09-14', gender: 'woman', intent: 'short_term_open_long', location: { ...PLACES.kungalv }, heightCm: 166,
    job: 'Photographer', smoking: 'socially', drinking: 'regularly', children: 'none', wantsChildren: 'unsure', languages: ['Norwegian', 'English', 'Swedish'],
    interests: ['photography', 'concerts', 'travel', 'fashion', 'music'], tones: [T.dusk, T.sea, T.ember],
    prompts: [
      ['The best way to spend a Friday night...', 'A small venue, a band nobody has heard of yet, and a late-night falafel.'],
      ['One thing you should know about me...', 'I will take a hundred photos of you and you will like exactly one.'],
    ],
    activeHoursAgo: 20,
  },
  {
    key: 'ida', firstName: 'Ida', birthDate: '1999-01-18', gender: 'woman', intent: 'long_term', location: PLACES.johanneberg, heightCm: 170,
    job: 'UX designer', education: 'HDK-Valand', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['gaming', 'movies', 'horror', 'cooking', 'travel', 'technology'], tones: [T.ember, T.sand, T.plum, T.sea],
    prompts: [
      ['A perfect Sunday looks like...', 'Slow breakfast, a long walk by the water, then a horror film I will watch through my fingers.'],
      ["I'm weirdly passionate about...", 'Ranking every ramen place in Gothenburg. The spreadsheet is real and it has tabs.'],
      ['Together we could...', 'Finally finish Baldur’s Gate 3 co-op. I have two save files and no follow-through.'],
    ],
    bio: 'Designs apps for a living, still can’t figure out my own thermostat.',
    activeHoursAgo: 1,
  },
  {
    key: 'hanna', firstName: 'Hanna', birthDate: '1997-06-03', gender: 'woman', intent: 'long_term', location: PLACES.molndal, heightCm: 174,
    job: 'Physiotherapist', education: 'Sahlgrenska Academy', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['gym', 'running', 'history', 'books', 'coffee'], tones: [T.sea, T.sage, T.sand],
    prompts: [
      ['My ideal first date...', 'Coffee and a walk. If it goes well, a second coffee. I have no chill about coffee.'],
      ["Something I'll never shut up about...", 'Roman roads. They were basically the internet of the ancient world.'],
    ],
    activeHoursAgo: 5,
  },
  {
    key: 'elin', firstName: 'Elin', birthDate: '2000-04-27', gender: 'woman', intent: 'long_term_open_short', location: PLACES.haga, heightCm: 165,
    job: 'Backend developer', education: 'Chalmers', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'open',
    languages: ['Swedish', 'English', 'Finnish'], interests: ['technology', 'gaming', 'board_games', 'science', 'anime'], tones: [T.dusk, T.stone, T.clay],
    prompts: [
      ["The hill I'll die on...", 'Tabs over spaces. Also, pineapple belongs on pizza.'],
      ['A random fact I love...', 'Octopuses have three hearts and still manage to look unbothered.'],
    ],
    activeHoursAgo: 48,
  },
  {
    key: 'moa', firstName: 'Moa', birthDate: '1995-10-11', gender: 'woman', intent: 'long_term', location: PLACES.kungsbacka, heightCm: 169,
    job: 'Primary school teacher', smoking: 'never', drinking: 'rarely', children: 'has_children', wantsChildren: 'open',
    languages: ['Swedish', 'English'], interests: ['cooking', 'nature', 'hiking', 'history', 'movies'], tones: [T.sage, T.sand, T.ember],
    prompts: [
      ['One thing you should know about me...', 'I have a six-year-old who will absolutely ask you about dinosaurs.'],
      ["I'm looking for someone who...", 'Is steady, kind, and doesn’t take themselves too seriously.'],
    ],
    bio: 'Mum, teacher, amateur baker of slightly lopsided cakes.',
    activeHoursAgo: 26,
  },
  {
    key: 'julia', firstName: 'Julia', birthDate: '2001-08-08', gender: 'woman', intent: 'casual', location: PLACES.majorna, heightCm: 162,
    job: 'Bartender', smoking: 'socially', drinking: 'regularly', children: 'none', wantsChildren: 'unsure',
    languages: ['Swedish', 'English'], interests: ['concerts', 'music', 'fashion', 'art', 'comedy'], tones: [T.plum, T.dusk, T.clay],
    prompts: [
      ['The best way to spend a Friday night...', 'Behind the bar, then after the bar. You choose.'],
      ["We'll get along if...", 'You tip well and dance badly.'],
    ],
    activeHoursAgo: 3,
  },
  {
    key: 'amanda', firstName: 'Amanda', birthDate: '1998-02-14', gender: 'woman', intent: 'long_term', location: PLACES.stockholm, heightCm: 172,
    job: 'Product manager', education: 'KTH', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['technology', 'gym', 'travel', 'movies', 'history'], tones: [T.sea, T.clay, T.stone],
    prompts: [
      ['Together we could...', 'Plan a trip with a ridiculous spreadsheet and then ignore it entirely.'],
      ['A green flag I look for...', 'You have opinions and you can change them.'],
    ],
    activeHoursAgo: 2,
  },
  {
    key: 'sara', firstName: 'Sara', birthDate: '1992-03-22', gender: 'woman', intent: 'long_term', location: PLACES.haga, heightCm: 167,
    job: 'Lawyer', education: 'University of Gothenburg', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English', 'French'], interests: ['horror', 'movies', 'travel', 'food', 'writing'], tones: [T.stone, T.plum, T.sand],
    prompts: [
      ['My most irrational fear...', 'Escalators. I will take the stairs and pretend it’s for fitness.'],
      ["I'll fall for you if...", 'You can recommend a horror film I haven’t seen. Good luck.'],
    ],
    activeHoursAgo: 10,
  },
  {
    key: 'klara', firstName: 'Klara', birthDate: '2004-05-05', gender: 'woman', intent: 'short_term_open_long', location: PLACES.johanneberg, heightCm: 160,
    job: 'Student', education: 'University of Gothenburg', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'unsure',
    languages: ['Swedish', 'English'], interests: ['photography', 'art', 'coffee', 'anime', 'movies'], tones: [T.ember, T.dusk, T.sage],
    prompts: [
      ['A perfect Sunday looks like...', 'Film camera, a new neighbourhood, too many cinnamon buns.'],
      ["I'm weirdly passionate about...", 'Old film cameras. I own nine. I use two.'],
    ],
    activeHoursAgo: 8,
  },
  {
    key: 'fatima', firstName: 'Fatima', birthDate: '1999-09-30', gender: 'woman', intent: 'long_term', location: PLACES.hisingen, heightCm: 164,
    job: 'Pharmacist', education: 'University of Gothenburg', religion: 'Muslim', smoking: 'never', drinking: 'never', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'Arabic', 'English'], interests: ['books', 'cooking', 'travel', 'history', 'nature'], tones: [T.sand, T.sea, T.clay],
    prompts: [
      ['The quickest way to my heart is...', 'Bring me a book you loved and tell me why.'],
      ["I'm looking for someone who...", 'Values family, laughs easily, and is serious about building something.'],
      ['A random fact I love...', 'The oldest known recipe is for beer. Not my drink, but still impressive.'],
    ],
    activeHoursAgo: 30,
  },
  {
    key: 'linnea', firstName: 'Linnea', birthDate: '1996-12-12', gender: 'woman', intent: 'figuring_out', location: PLACES.lerum, heightCm: 176,
    job: 'Graphic designer', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'unsure',
    languages: ['Swedish', 'English'], interests: ['art', 'gaming', 'music', 'cycling', 'diy'], tones: [T.clay, T.sage, T.stone],
    prompts: [
      ['One thing you should know about me...', 'I cycle everywhere, including places I should probably take the train.'],
      ['Together we could...', 'Build an unnecessarily complicated bookshelf.'],
    ],
    activeHoursAgo: 72,
  },
  {
    key: 'wilma', firstName: 'Wilma', birthDate: '2000-07-19', gender: 'woman', intent: 'long_term', location: PLACES.alingsas, heightCm: 167,
    job: 'Veterinary nurse', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['animals', 'hiking', 'horror', 'movies', 'gym'], tones: [T.sage, T.ember, T.sea, T.sand],
    prompts: [
      ['A perfect Sunday looks like...', 'Forest walk with two very muddy dogs, then a horror marathon under a blanket.'],
      ['A green flag I look for...', 'Animals like you. They always know.'],
    ],
    activeHoursAgo: 4,
  },
  {
    key: 'ebba', firstName: 'Ebba', birthDate: '1998-11-02', gender: 'woman', intent: 'casual', location: PLACES.haga, heightCm: 170,
    job: 'Marketing coordinator', smoking: 'rarely', drinking: 'regularly', children: 'none', wantsChildren: 'does_not_want',
    languages: ['Swedish', 'English'], interests: ['concerts', 'travel', 'fashion', 'food', 'comedy'], tones: [T.plum, T.sand, T.dusk],
    prompts: [
      ['The best way to spend a Friday night...', 'Natural wine bar, then whatever happens.'],
      ['My most irrational fear...', 'Voicemails.'],
    ],
    activeHoursAgo: 12,
  },
  {
    key: 'johanna', firstName: 'Johanna', birthDate: '1994-04-04', gender: 'woman', intent: 'long_term_open_short', location: PLACES.stenungsund, heightCm: 168,
    job: 'Process engineer', smoking: 'regularly', drinking: 'socially', children: 'none', wantsChildren: 'open',
    languages: ['Swedish', 'English'], interests: ['fishing', 'nature', 'camping', 'cars', 'movies'], tones: [T.stone, T.sea, T.sage],
    prompts: [
      ['A perfect Sunday looks like...', 'Out on the boat before anyone else is awake.'],
      ["We'll get along if...", 'You don’t mind smelling a bit like campfire.'],
    ],
    activeHoursAgo: 15,
  },
  {
    key: 'alice', firstName: 'Alice', birthDate: '1999-08-25', gender: 'woman', intent: 'long_term', location: PLACES.boras, heightCm: 172,
    job: 'PhD student, medieval history', education: 'University of Gothenburg', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English', 'Latin'], interests: ['history', 'books', 'science', 'board_games', 'technology', 'gaming'], tones: [T.sand, T.dusk, T.ember],
    prompts: [
      ["Something I'll never shut up about...", 'Medieval siege warfare. Yes, I have opinions about trebuchets.'],
      ['Together we could...', 'Visit every castle ruin in Västergötland and rate them.'],
      ['A green flag I look for...', 'Curiosity. About anything, honestly.'],
    ],
    bio: 'Mostly in archives. Occasionally in sunlight.',
    activeHoursAgo: 2,
  },
  {
    key: 'matilda', firstName: 'Matilda', birthDate: '1997-01-29', gender: 'woman', intent: 'long_term', location: PLACES.trollhattan, heightCm: 165,
    job: 'Engineer', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['gym', 'gaming', 'movies', 'travel', 'technology'], tones: [T.ember, T.stone, T.sea],
    prompts: [
      ['A perfect Sunday looks like...', 'Gym, pho, and a new game I’ll play until 2am.'],
      ['A green flag I look for...', 'You plan the second date before the first one ends.'],
    ],
    activeHoursAgo: 7,
  },
  {
    key: 'tove', firstName: 'Tove', birthDate: '1999-05-16', gender: 'woman', intent: 'long_term', location: PLACES.majorna, heightCm: 171,
    job: 'Chef', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English', 'Italian'], interests: ['cooking', 'food', 'motorsport', 'cars', 'movies'], tones: [T.clay, T.ember, T.sand],
    prompts: [
      ['The quickest way to my heart is...', 'Eat what I cook and tell me honestly what you think.'],
      ['My ideal first date...', 'Street food market. I’ll judge every stall.'],
    ],
    activeHoursAgo: 24 * 20,
  },
  {
    key: 'nadia', firstName: 'Nadia', birthDate: '2001-03-03', gender: 'woman', intent: 'short_term_open_long', location: PLACES.hisingen, heightCm: 163,
    job: 'Dental hygienist', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'open',
    languages: ['Swedish', 'English', 'Persian'], interests: ['gym', 'running', 'swimming', 'travel', 'food'], tones: [T.sea, T.plum, T.stone],
    prompts: [
      ['One thing you should know about me...', 'idk, ask me'],
      ['A perfect Sunday looks like...', 'Gym then brunch'],
    ],
    activeHoursAgo: 36,
  },
  {
    key: 'elsa', firstName: 'Elsa', birthDate: '1993-02-11', gender: 'woman', intent: 'long_term', location: PLACES.kungalv, heightCm: 178,
    job: 'Copywriter', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'open',
    languages: ['Swedish', 'English'], interests: ['gaming', 'horror', 'writing', 'books', 'movies'], tones: [T.dusk, T.clay, T.sage],
    prompts: [
      ["I'm weirdly passionate about...", 'Bad horror films. The worse the effects, the better.'],
      ["I'll fall for you if...", 'You read the book before you watch the film.'],
    ],
    activeHoursAgo: 50,
  },
  {
    key: 'oskar', firstName: 'Oskar', birthDate: '1998-06-21', gender: 'man', intent: 'long_term', location: PLACES.haga, heightCm: 184,
    job: 'Electrician', smoking: 'never', drinking: 'socially', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English'], interests: ['football', 'diy', 'cooking', 'camping', 'music'], tones: [T.stone, T.sea, T.sand],
    prompts: [
      ['Together we could...', 'Renovate something. Anything. I need a project.'],
      ['My ideal first date...', 'Bowling. I’m bad at it, which is the point.'],
    ],
    activeHoursAgo: 3,
  },
  {
    key: 'daniel', firstName: 'Daniel', birthDate: '1995-11-09', gender: 'man', intent: 'long_term', location: PLACES.johanneberg, heightCm: 179,
    job: 'Doctor', education: 'Sahlgrenska Academy', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'wants',
    languages: ['Swedish', 'English', 'Polish'], interests: ['running', 'books', 'travel', 'coffee', 'science'], tones: [T.sea, T.sand, T.dusk],
    prompts: [
      ["I'm looking for someone who...", 'Wants a calm, warm home and a few adventures a year.'],
      ['A random fact I love...', 'Your stomach gets a new lining every few days.'],
    ],
    activeHoursAgo: 9,
  },
  {
    key: 'ali', firstName: 'Ali', birthDate: '1997-03-30', gender: 'man', intent: 'long_term_open_short', location: PLACES.molndal, heightCm: 181,
    job: 'Civil engineer', smoking: 'never', drinking: 'never', children: 'none', wantsChildren: 'open',
    languages: ['Swedish', 'English', 'Turkish'], interests: ['football', 'gym', 'travel', 'food', 'cars'], tones: [T.ember, T.stone, T.sage],
    prompts: [
      ['The quickest way to my heart is...', 'Good food and better conversation.'],
      ['A perfect Sunday looks like...', 'Five-a-side football, then a family lunch that lasts four hours.'],
    ],
    activeHoursAgo: 18,
  },
  {
    key: 'leo', firstName: 'Leo', birthDate: '1996-08-14', gender: 'man', intent: 'casual', location: PLACES.majorna, heightCm: 177,
    job: 'Musician', smoking: 'socially', drinking: 'regularly', children: 'none', wantsChildren: 'does_not_want',
    languages: ['Swedish', 'English'], interests: ['music', 'concerts', 'art', 'comedy'], tones: [T.plum, T.ember, T.stone],
    prompts: [
      ['The best way to spend a Friday night...', 'Playing a gig. Come say hi after.'],
      ['My most irrational fear...', 'Silence in elevators.'],
    ],
    activeHoursAgo: 30,
  },
  {
    key: 'robin', firstName: 'Robin', birthDate: '1999-10-01', gender: 'nonbinary', intent: 'figuring_out', location: PLACES.haga, heightCm: 172,
    job: 'Librarian', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'unsure',
    languages: ['Swedish', 'English'], interests: ['books', 'board_games', 'writing', 'coffee', 'animals'], tones: [T.sage, T.dusk, T.sand],
    prompts: [
      ["We'll get along if...", 'You have a strong opinion about the best board game and can defend it.'],
      ['A perfect Sunday looks like...', 'Library café, a stack of novels, rain outside.'],
    ],
    activeHoursAgo: 11,
  },
];

/** Everyone except the current user. */
export function createMockProfiles(nowIso: string): Profile[] {
  const now = new Date(nowIso).getTime();
  return SEEDS.map((seed) => build(seed, now));
}
