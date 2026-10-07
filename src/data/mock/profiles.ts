import type { Photo, Profile } from '../../domain/types';
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

/** A small initial set. Part 3 expands this to ~25 varied profiles. */
export function createMockProfiles(now: string): Profile[] {
  return [
    {
      id: 'p-emma', userId: 'u-emma', firstName: 'Emma', birthDate: '1998-07-02', gender: 'woman',
      intent: 'long_term', location: { ...GOTHENBURG, lat: 57.69, lng: 11.95 }, heightCm: 168,
      job: 'Architect', education: 'Chalmers', smoking: 'never', drinking: 'socially',
      children: 'none', wantsChildren: 'wants', languages: ['Swedish', 'English', 'Japanese'],
      interests: ['travel', 'horror', 'cooking', 'art', 'movies'],
      photos: photos('p-emma', 'Emma', [TONES.clay, TONES.sand, TONES.dusk]),
      prompts: [
        { id: 'p-emma-q1', prompt: 'My ideal first date...', answer: 'A walk through Haga, coffee that turns into dinner, and an argument about the best Studio Ghibli film.' },
        { id: 'p-emma-q2', prompt: 'A random fact I love...', answer: 'Kyoto has over 1,600 temples. I have been to 41 so far.' },
      ],
      visibility: { job: true, education: true, height: true }, updatedAt: now,
    },
    {
      id: 'p-sofia', userId: 'u-sofia', firstName: 'Sofia', birthDate: '1996-11-21', gender: 'woman',
      intent: 'long_term_open_short', location: { ...GOTHENBURG, lat: 57.74, lng: 12.01 }, heightCm: 171,
      job: 'Nurse', smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'open',
      languages: ['Swedish', 'English', 'Spanish'], interests: ['hiking', 'nature', 'coffee', 'books', 'animals'],
      photos: photos('p-sofia', 'Sofia', [TONES.sage, TONES.stone, TONES.sea]),
      prompts: [
        { id: 'p-sofia-q1', prompt: 'The quickest way to my heart is...', answer: 'Remembering how I take my coffee. Oat milk, no sugar, a little too hot.' },
        { id: 'p-sofia-q2', prompt: 'A green flag I look for...', answer: 'You are kind to waiters and you text back when you said you would.' },
      ],
      visibility: { job: true, height: true }, updatedAt: now,
    },
    {
      id: 'p-maja', userId: 'u-maja', firstName: 'Maja', birthDate: '2000-02-09', gender: 'woman',
      intent: 'figuring_out', location: { ...GOTHENBURG, lat: 57.7, lng: 11.9 }, heightCm: 163,
      job: 'Game designer', education: 'University West', smoking: 'never', drinking: 'socially',
      children: 'none', wantsChildren: 'unsure', languages: ['Swedish', 'English'],
      interests: ['gaming', 'anime', 'board_games', 'technology', 'comedy'],
      photos: photos('p-maja', 'Maja', [TONES.plum, TONES.ember, TONES.dusk]),
      prompts: [
        { id: 'p-maja-q1', prompt: 'The hill I\'ll die on...', answer: 'Co-op games are the best relationship test ever invented.' },
        { id: 'p-maja-q2', prompt: 'We\'ll get along if...', answer: 'You can lose at Mario Kart gracefully. Or at least entertainingly.' },
      ],
      visibility: { job: true, education: true }, updatedAt: now,
    },
    {
      id: 'p-lina', userId: 'u-lina', firstName: 'Lina', birthDate: '1995-05-30', gender: 'woman',
      intent: 'long_term', location: { ...GOTHENBURG, lat: 57.65, lng: 12.02 }, heightCm: 175,
      job: 'History teacher', education: 'University of Gothenburg', religion: 'Christian',
      smoking: 'never', drinking: 'rarely', children: 'none', wantsChildren: 'wants',
      languages: ['Swedish', 'English', 'German'], interests: ['history', 'books', 'faith', 'running', 'music'],
      photos: photos('p-lina', 'Lina', [TONES.sand, TONES.clay, TONES.stone]),
      prompts: [
        { id: 'p-lina-q1', prompt: 'Something I\'ll never shut up about...', answer: 'The Vasa ship. Built to impress, sank in twenty minutes. Relatable.' },
        { id: 'p-lina-q2', prompt: 'I\'m looking for someone who...', answer: 'Asks good questions and actually listens to the answers.' },
      ],
      visibility: { job: true, education: true, religion: true, height: true }, updatedAt: now,
    },
    {
      id: 'p-nora', userId: 'u-nora', firstName: 'Nora', birthDate: '1997-09-14', gender: 'woman',
      intent: 'short_term_open_long', location: { ...GOTHENBURG, lat: 57.78, lng: 11.88 }, heightCm: 166,
      job: 'Photographer', smoking: 'socially', drinking: 'regularly', children: 'none', wantsChildren: 'unsure',
      languages: ['Norwegian', 'English', 'Swedish'], interests: ['photography', 'concerts', 'travel', 'fashion', 'music'],
      photos: photos('p-nora', 'Nora', [TONES.dusk, TONES.sea, TONES.ember]),
      prompts: [
        { id: 'p-nora-q1', prompt: 'The best way to spend a Friday night...', answer: 'A small venue, a band nobody has heard of yet, and a late-night falafel.' },
        { id: 'p-nora-q2', prompt: 'One thing you should know about me...', answer: 'I will take a hundred photos of you and you will like exactly one.' },
      ],
      visibility: { job: true, smoking: true, drinking: true }, updatedAt: now,
    },
  ];
}
