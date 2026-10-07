import { CITIES } from '../../domain/cities';
import { DATING_INTENTS, type DatingIntent } from '../../domain/intent';
import { INTEREST_IDS, type InterestId } from '../../domain/interest';
import type { ApproxLocation, EducationLevel, Frequency, Gender, Profile, WantsChildren } from '../../domain/types';
import { daysAgo, hoursAgo } from '../../utils/time';
import { TONES } from './tones';

/**
 * A larger pool of fictional people, generated deterministically (same input → same people),
 * so Explore has real depth: hundreds of profiles at many distances, around every city
 * a new account can choose during onboarding. The hand-written seeds in `profiles.ts`
 * stay the "cast" for the demo story; these fill the wider world around them.
 */

/** Small, fast, seedable PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T,>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
const chance = (r: Rand, p: number) => r() < p;
const between = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
function weighted<T>(r: Rand, entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of entries) if ((x -= w) < 0) return v;
  return entries[entries.length - 1]![0];
}
function sample<T>(r: Rand, list: readonly T[], n: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]!);
  return out;
}

const WOMEN = [
  'Alva', 'Astrid', 'Agnes', 'Alexandra', 'Bianca', 'Cajsa', 'Clara', 'Dagny', 'Edith', 'Ella', 'Ellen', 'Elvira', 'Emilia',
  'Erika', 'Evelina', 'Felicia', 'Filippa', 'Frida', 'Gabriella', 'Hedda', 'Helena', 'Ines', 'Iris', 'Jasmine', 'Jenny',
  'Josefin', 'Karin', 'Lea', 'Leila', 'Liv', 'Louise', 'Lova', 'Lovisa', 'Luna', 'Malin', 'Maria', 'Mariam', 'Meja',
  'Mira', 'Mona', 'Natalie', 'Nellie', 'Olivia', 'Paula', 'Rebecca', 'Ronja', 'Saga', 'Selma', 'Signe', 'Siri', 'Stina',
  'Tilda', 'Thea', 'Valentina', 'Vera', 'Vilma', 'Yasmin', 'Zara', 'Anna', 'Camilla', 'Hanna', 'Nina', 'Petra', 'Tova',
] as const;
const MEN = [
  'Adam', 'Albin', 'Alexander', 'Anton', 'Arvid', 'Axel', 'Benjamin', 'Carl', 'David', 'Elias', 'Emil', 'Erik', 'Filip',
  'Gustav', 'Hampus', 'Henrik', 'Hugo', 'Isak', 'Jakob', 'Joel', 'Johan', 'Jonas', 'Karim', 'Kevin', 'Lucas', 'Ludvig',
  'Marcus', 'Martin', 'Max', 'Melker', 'Mikael', 'Nils', 'Noah', 'Olle', 'Omar', 'Rasmus', 'Sami', 'Sebastian', 'Simon',
  'Theo', 'Tobias', 'Viktor', 'Vincent', 'William', 'Yusuf', 'Linus', 'Mattias', 'Pontus',
] as const;
const NONBINARY = ['Alex', 'Charlie', 'Kim', 'Love', 'Micke', 'Noa', 'Sam', 'Vic', 'Eli', 'Rio'] as const;

/** Names already used by the hand-written cast (and the demo user), so nobody is ambiguous. */
const CAST = new Set([
  'Emma', 'Sofia', 'Maja', 'Lina', 'Ida', 'Hanna', 'Elin', 'Amanda', 'Sara', 'Klara', 'Fatima', 'Alice', 'Daniel', 'Isabel', 'Moa',
  'Oskar', 'Ali', 'Nadia', 'Tove', 'Julia', 'Leo', 'Wilma', 'Linnea', 'Ebba', 'Johanna', 'Matilda', 'Robin', 'Nora', 'Freja', 'Elsa', 'Alex',
]);
const free = (names: readonly string[]) => names.filter((n) => !CAST.has(n));
const WOMEN_FREE = free(WOMEN);
const MEN_FREE = free(MEN);
const NONBINARY_FREE = free(NONBINARY);

const JOBS = [
  'Teacher', 'Nurse', 'Physiotherapist', 'UX designer', 'Software developer', 'Chef', 'Barista', 'Architect', 'Engineer',
  'Midwife', 'Journalist', 'Photographer', 'Social worker', 'Pharmacist', 'Accountant', 'Carpenter', 'Electrician',
  'Project manager', 'Marketing lead', 'Lawyer', 'Researcher', 'Dentist', 'Veterinarian', 'Student', 'Student',
  'Firefighter', 'Gardener', 'Florist', 'Product manager', 'Pilot', 'Psychologist', 'Musician', 'Illustrator',
  'Personal trainer', 'Sales manager', 'Librarian', 'Economist', 'Doctor', 'Bus driver', 'Baker',
] as const;
const SCHOOLS = [
  'University of Gothenburg', 'Chalmers', 'Lund University', 'Uppsala University', 'KTH', 'Stockholm University',
  'Linköping University', 'Karolinska Institutet', 'Jönköping University', 'Örebro University', 'Malmö University',
] as const;

const EXTRA_LANGUAGES = ['Spanish', 'German', 'French', 'Arabic', 'Persian', 'Finnish', 'Norwegian', 'Polish', 'Italian', 'Russian', 'Ukrainian', 'Turkish', 'Danish'] as const;
const RELIGIONS = ['Agnostic', 'Atheist', 'Christian', 'Spiritual', 'Muslim', 'Catholic', 'Buddhist', 'Jewish', 'Hindu'] as const;
const POLITICS = ['Liberal', 'Moderate', 'Not political', 'Conservative'] as const;

const BIOS = [
  'Here for real conversations, good food and a partner in crime.',
  'Slow mornings, long walks and something tasty in the oven.',
  'Happiest outdoors, in the kitchen, or halfway through a good book.',
  'Curious about people. Bad at small talk, great at long talk.',
  'Weekday planner, weekend wanderer.',
  'Looking for someone kind, consistent and a little bit silly.',
  'I will always say yes to a picnic.',
  'Coffee first, then adventures.',
  'Recently moved here and still finding the best cinnamon buns.',
  'Family, friends, the sea. In roughly that order.',
  'Part-time runner, full-time snack enthusiast.',
  'I collect houseplants and terrible puns.',
  'Calm energy, warm heart, strong opinions about pizza.',
  'Learning to cook my grandmother’s recipes, one disaster at a time.',
  'Trying to see every sunset I can.',
  'Always planning the next trip.',
  'Big on honesty, small dogs and Sunday dinners.',
  'Bookshop browser, concert goer, terrible dancer.',
] as const;

const PROMPTS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['The way to win me over...', ['Bake something together, make me laugh and be curious about my world.', 'Remember the small things I mention. It means a lot.', 'Show up on time and ask good questions.']],
  ['Green flags I look for...', ['Kindness, consistency and someone who actually makes an effort.', 'You talk warmly about your friends.', 'You’re honest, even when it’s awkward.']],
  ['A typical Sunday...', ['Slow morning, good coffee, a long walk and something tasty in the oven.', 'Market, then a long lunch, then absolutely nothing.', 'Swim if the weather allows, a film if it doesn’t.']],
  ['My ideal first date...', ['A walk by the water, then dinner if we’re still talking.', 'Coffee somewhere quiet. Simple and easy.', 'A museum, so we have something to talk about.']],
  ['I’m weirdly passionate about...', ['Finding the perfect cinnamon bun.', 'Old maps. I could look at them for hours.', 'Organising spice racks.']],
  ['Together we could...', ['Cook our way through a cookbook.', 'Plan a road trip along the coast.', 'Start a tiny balcony garden.']],
  ['I’m looking for someone who...', ['Wants a home full of friends and good food.', 'Is kind to everyone, not just me.', 'Laughs easily and means what they say.']],
  ['The best way to spend a Friday night...', ['Dinner with friends that runs late.', 'Takeaway, blanket, a good series.', 'A concert, then talking about it all the way home.']],
  ['A random fact I love...', ['Sea otters hold hands when they sleep.', 'Honey never goes off.', 'Octopuses have three hearts.']],
  ['Make me laugh...', ['Bad puns welcome.', 'Your most embarrassing story wins.', 'Tell me your worst cooking fail.']],
] as const;

const TONE_LIST = Object.values(TONES);

/** Towns around Gothenburg at a range of distances, so the distance slider changes who you see. */
const WEST_COAST: ApproxLocation[] = [
  { city: 'Gothenburg', country: 'Sweden', lat: 57.71, lng: 11.97 },
  { city: 'Gothenburg', country: 'Sweden', lat: 57.7, lng: 11.94 },
  { city: 'Gothenburg', country: 'Sweden', lat: 57.73, lng: 12.0 },
  { city: 'Mölndal', country: 'Sweden', lat: 57.66, lng: 12.01 },
  { city: 'Partille', country: 'Sweden', lat: 57.74, lng: 12.11 },
  { city: 'Kungälv', country: 'Sweden', lat: 57.87, lng: 11.98 },
  { city: 'Lerum', country: 'Sweden', lat: 57.77, lng: 12.27 },
  { city: 'Kungsbacka', country: 'Sweden', lat: 57.49, lng: 12.08 },
  { city: 'Stenungsund', country: 'Sweden', lat: 58.07, lng: 11.82 },
  { city: 'Alingsås', country: 'Sweden', lat: 57.93, lng: 12.53 },
  { city: 'Varberg', country: 'Sweden', lat: 57.11, lng: 12.25 },
  { city: 'Borås', country: 'Sweden', lat: 57.72, lng: 12.94 },
  { city: 'Uddevalla', country: 'Sweden', lat: 58.35, lng: 11.94 },
  { city: 'Trollhättan', country: 'Sweden', lat: 58.28, lng: 12.29 },
  { city: 'Vänersborg', country: 'Sweden', lat: 58.38, lng: 12.32 },
  { city: 'Falkenberg', country: 'Sweden', lat: 56.9, lng: 12.49 },
  { city: 'Lysekil', country: 'Sweden', lat: 58.27, lng: 11.44 },
  { city: 'Skövde', country: 'Sweden', lat: 58.39, lng: 13.85 },
  { city: 'Halmstad', country: 'Sweden', lat: 56.67, lng: 12.86 },
];

/** How many generated people live in each area. The west coast is the demo's home. */
const WEST_COAST_COUNT = 150;
const PER_CITY_COUNT = 9;

function makeProfile(index: number, location: ApproxLocation, nowMs: number): Profile {
  const r = rng(index * 7919 + 17);
  const gender = weighted<Gender>(r, [['woman', 52], ['man', 42], ['nonbinary', 6]]);
  const firstName = gender === 'woman' ? pick(r, WOMEN_FREE) : gender === 'man' ? pick(r, MEN_FREE) : pick(r, NONBINARY_FREE);
  const key = `g${String(index).padStart(3, '0')}`;
  const id = `p-${key}`;
  const age = weighted(r, [[between(r, 20, 24), 22], [between(r, 25, 29), 34], [between(r, 30, 34), 26], [between(r, 35, 44), 18]] as const);
  const year = new Date(nowMs).getFullYear() - age - 1;
  const birthDate = `${year}-${String(between(r, 1, 12)).padStart(2, '0')}-${String(between(r, 1, 28)).padStart(2, '0')}`;
  const intent = weighted<DatingIntent>(r, [[DATING_INTENTS[0], 38], [DATING_INTENTS[1], 24], [DATING_INTENTS[2], 12], [DATING_INTENTS[3], 10], [DATING_INTENTS[4], 16]]);
  const smoking = weighted<Frequency>(r, [['never', 70], ['rarely', 14], ['socially', 11], ['regularly', 5]]);
  const drinking = weighted<Frequency>(r, [['never', 12], ['rarely', 26], ['socially', 52], ['regularly', 10]]);
  const children = chance(r, age > 30 ? 0.22 : 0.06) ? 'has_children' : 'none';
  const wantsChildren = weighted<WantsChildren>(r, [['wants', 40], ['open', 28], ['unsure', 20], ['does_not_want', 12]]);
  const job = pick(r, JOBS);
  const educationLevel = weighted<EducationLevel>(r, [['secondary', 14], ['vocational', 18], ['undergraduate', 40], ['postgraduate', 28]]);
  const studied = educationLevel === 'undergraduate' || educationLevel === 'postgraduate';
  const photoCount = weighted(r, [[1, 6], [2, 14], [3, 28], [4, 24], [5, 14], [6, 14]] as const);
  const startTone = between(r, 0, TONE_LIST.length - 1);
  const promptCount = weighted(r, [[1, 18], [2, 46], [3, 36]] as const);
  const prompts = sample(r, PROMPTS, promptCount).map(([prompt, answers], i) => ({ id: `${id}-q${i + 1}`, prompt, answer: pick(r, answers) }));
  const hidesBeliefs = chance(r, 0.35);
  // Jitter within ~3 km so people in one town aren't all at the same point.
  const jitter = () => Math.round((r() - 0.5) * 6) / 100;

  return {
    id,
    userId: `u-${key}`,
    firstName,
    birthDate,
    gender,
    intent,
    location: { ...location, lat: Math.round((location.lat + jitter()) * 100) / 100, lng: Math.round((location.lng + jitter()) * 100) / 100 },
    heightCm: gender === 'man' ? between(r, 170, 194) : gender === 'woman' ? between(r, 155, 180) : between(r, 160, 186),
    job,
    ...(studied && chance(r, 0.7) ? { education: pick(r, SCHOOLS) } : {}),
    educationLevel,
    religion: pick(r, RELIGIONS),
    politics: pick(r, POLITICS),
    smoking,
    drinking,
    children,
    wantsChildren,
    languages: ['Swedish', 'English', ...sample(r, EXTRA_LANGUAGES, weighted(r, [[0, 55], [1, 35], [2, 10]] as const))].filter((l, i, a) => a.indexOf(l) === i),
    interests: sample<InterestId>(r, INTEREST_IDS, between(r, 5, 8)),
    photos: Array.from({ length: photoCount }, (_, i) => ({ id: `${id}-p${i + 1}`, tone: TONE_LIST[(startTone + i * 3) % TONE_LIST.length]!, alt: `Photo ${i + 1} of ${firstName}` })),
    prompts,
    ...(chance(r, 0.62) ? { bio: pick(r, BIOS) } : {}),
    visibility: { job: true, education: true, height: chance(r, 0.9), drinking: true, smoking: true, children: true, religion: !hidesBeliefs, politics: !hidesBeliefs && chance(r, 0.6) },
    verification: { photo: chance(r, 0.45) ? 'verified' : 'unverified', id: chance(r, 0.15) ? 'verified' : 'unverified' },
    ...(chance(r, 0.05) ? { hideDistance: true } : {}),
    updatedAt: daysAgo(between(r, 1, 30), nowMs),
    lastActiveAt: hoursAgo(weighted(r, [[between(r, 0, 12), 45], [between(r, 12, 72), 30], [between(r, 72, 24 * 21), 25]] as const), nowMs),
  };
}

/** ~300 generated people: most around Gothenburg at varied distances, a handful near every other city. */
export function createGeneratedProfiles(nowMs: number): Profile[] {
  const out: Profile[] = [];
  let index = 1;
  for (let i = 0; i < WEST_COAST_COUNT; i += 1) out.push(makeProfile(index++, WEST_COAST[i % WEST_COAST.length]!, nowMs));
  for (const city of CITIES) {
    if (city.id === 'gothenburg' || city.id === 'molndal' || city.id === 'kungsbacka' || city.id === 'boras' || city.id === 'trollhattan' || city.id === 'halmstad') continue;
    for (let i = 0; i < PER_CITY_COUNT; i += 1) out.push(makeProfile(index++, { city: city.city, country: city.country, lat: city.lat, lng: city.lng }, nowMs));
  }
  return out;
}
