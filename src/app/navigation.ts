import type { IconName } from '../components/ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** The five primary sections. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/explore', label: 'Explore', icon: 'cards' },
  { to: '/standouts', label: 'Standouts', icon: 'star' },
  { to: '/likes', label: 'Likes', icon: 'heart' },
  { to: '/chats', label: 'Chats', icon: 'chat' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export const ROUTES = {
  explore: '/explore',
  standouts: '/standouts',
  likes: '/likes',
  chats: '/chats',
  profile: '/profile',
  exploreProfile: (profileId: string) => `/explore/${profileId}`,
  likeProfile: (likeId: string) => `/likes/${likeId}`,
  matchCelebration: (matchId: string) => `/match/${matchId}`,
  chat: (matchId: string) => `/chats/${matchId}`,
  chatProfile: (matchId: string) => `/chats/${matchId}/profile`,
  archived: '/chats/archived',
  settings: '/settings',
  filters: '/settings/filters',
  privacy: '/settings/privacy',
  verification: '/settings/verification',
  blocked: '/settings/blocked',
  safety: '/settings/safety',
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
