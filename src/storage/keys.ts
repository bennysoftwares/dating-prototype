/** Every persisted key in one place. Bump a version when its shape changes. */
export const STORAGE_KEYS = {
  theme: { key: 'theme', version: 1 },
  dbMeta: { key: 'db.meta', version: 1 },
  dbUser: { key: 'db.user', version: 1 },
  dbPreferences: { key: 'db.preferences', version: 1 },
  dbProfiles: { key: 'db.profiles', version: 1 },
  dbMatches: { key: 'db.matches', version: 1 },
  dbMessages: { key: 'db.messages', version: 1 },
  dbLikes: { key: 'db.likes', version: 1 },
  dbPasses: { key: 'db.passes', version: 1 },
  dbDailyPicks: { key: 'db.dailyPicks', version: 1 },
  dbBlocks: { key: 'db.blocks', version: 1 },
  dbReports: { key: 'db.reports', version: 1 },
  dbDates: { key: 'db.dates', version: 1 },
  dbDateFeedback: { key: 'db.dateFeedback', version: 1 },
  dbPrivacy: { key: 'db.privacy', version: 1 },
  /** Unsent message drafts per match. */
  drafts: { key: 'drafts', version: 1 },
  onboardingDraft: { key: 'onboarding.draft', version: 1 },
  /** Photos are stored apart from the draft so typing never rewrites large image data. */
  onboardingPhotos: { key: 'onboarding.photos', version: 1 },
} as const;
