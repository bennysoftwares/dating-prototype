import type { IconName } from '../components/ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** The four primary sections. Do not add more tabs. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/discover', label: 'Discover', icon: 'discover' },
  { to: '/likes', label: 'Likes', icon: 'heart' },
  { to: '/matches', label: 'Matches', icon: 'chat' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export const ROUTES = {
  discover: '/discover',
  likes: '/likes',
  matches: '/matches',
  profile: '/profile',
  profileEdit: '/profile/edit',
  profileEditStep: (stepId: string) => `/profile/edit/${stepId}`,
  profilePreview: '/profile/preview',
  /** Hidden developer panel. Not linked from navigation. */
  debug: '/debug',
} as const;

export const ONBOARDING_ROUTES = {
  welcome: '/welcome',
  step: (stepId: string) => `/onboarding/${stepId}`,
  preview: '/onboarding/preview',
} as const;
