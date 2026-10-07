import { createHashRouter, Navigate, Outlet } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { ConnectionsProvider } from '../connections/ConnectionsProvider';
import { DiscoveryProvider } from '../discovery/DiscoveryProvider';
import { LikeProfileScreen } from '../screens/likes/LikeProfileScreen';
import { ArchivedScreen } from '../screens/matches/ArchivedScreen';
import { ChatProfileScreen } from '../screens/matches/ChatProfileScreen';
import { ChatScreen } from '../screens/matches/ChatScreen';
import { MatchCelebrationScreen } from '../screens/matches/MatchCelebrationScreen';
import { DiscoverProfileScreen } from '../screens/discover/DiscoverProfileScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { LikesScreen } from '../screens/likes/LikesScreen';
import { MatchesScreen } from '../screens/matches/MatchesScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { ProfilePreviewScreen } from '../screens/profile/ProfilePreviewScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotFoundScreen } from '../screens/system/NotFoundScreen';
import { RouteError } from '../screens/system/RouteError';
import { SessionGate, Splash } from '../screens/system/SessionGate';
import { ONBOARDING_ROUTES, ROUTES } from './navigation';

/**
 * Rarely used or first-run screens (onboarding, settings, the debug panel) are loaded on demand
 * to keep the main bundle small.
 *
 * Hash routing (`/#/discover`) works on GitHub Pages with no server rewrites:
 * refreshing or deep-linking any screen always loads index.html.
 */
export const router = createHashRouter([
  {
    errorElement: <RouteError />,
    // Shown while a lazily loaded screen (onboarding, settings, debug) loads on first visit.
    hydrateFallbackElement: <Splash />,
    children: [
      { index: true, element: <Navigate to={ROUTES.discover} replace /> },

      // Not finished onboarding yet.
      {
        element: <SessionGate mode="guest" />,
        children: [
          { path: ONBOARDING_ROUTES.welcome, lazy: () => import('../screens/onboarding/WelcomeScreen').then((m) => ({ Component: m.WelcomeScreen })) },
          { path: ONBOARDING_ROUTES.preview, lazy: () => import('../screens/onboarding/OnboardingPreviewScreen').then((m) => ({ Component: m.OnboardingPreviewScreen })) },
          { path: '/onboarding/:stepId', lazy: () => import('../screens/onboarding/OnboardingStepScreen').then((m) => ({ Component: m.OnboardingStepScreen })) },
          { path: '/onboarding', element: <Navigate to={ONBOARDING_ROUTES.welcome} replace /> },
        ],
      },

      // Signed in with a finished profile.
      {
        element: (
          <SessionGate mode="member">
            <ConnectionsProvider>
              <DiscoveryProvider>
                <Outlet />
              </DiscoveryProvider>
            </ConnectionsProvider>
          </SessionGate>
        ),
        children: [
          {
            element: <AppShell />,
            children: [
              { path: ROUTES.discover, element: <DiscoverScreen /> },
              { path: ROUTES.likes, element: <LikesScreen /> },
              { path: ROUTES.matches, element: <MatchesScreen /> },
              { path: ROUTES.archived, element: <ArchivedScreen /> },
              { path: ROUTES.settings, lazy: () => import('../screens/settings/SettingsScreen').then((m) => ({ Component: m.SettingsScreen })) },
              { path: ROUTES.filters, lazy: () => import('../screens/settings/FiltersScreen').then((m) => ({ Component: m.FiltersScreen })) },
              { path: ROUTES.privacy, lazy: () => import('../screens/settings/PrivacyScreen').then((m) => ({ Component: m.PrivacyScreen })) },
              { path: ROUTES.verification, lazy: () => import('../screens/settings/VerificationScreen').then((m) => ({ Component: m.VerificationScreen })) },
              { path: ROUTES.blocked, lazy: () => import('../screens/settings/BlockedScreen').then((m) => ({ Component: m.BlockedScreen })) },
              { path: ROUTES.safety, lazy: () => import('../screens/settings/SafetyScreen').then((m) => ({ Component: m.SafetyScreen })) },
              { path: ROUTES.profile, element: <ProfileScreen /> },
              { path: ROUTES.profileEdit, element: <ProfileEditScreen /> },
              { path: ROUTES.profilePreview, element: <ProfilePreviewScreen /> },
            ],
          },
          // Full-screen views (no tab bar, primary actions in thumb reach).
          { path: '/discover/:profileId', element: <DiscoverProfileScreen /> },
          { path: '/likes/:likeId', element: <LikeProfileScreen /> },
          { path: '/match/:matchId', element: <MatchCelebrationScreen /> },
          { path: '/matches/:matchId', element: <ChatScreen /> },
          { path: '/matches/:matchId/profile', element: <ChatProfileScreen /> },
          { path: '/profile/edit/:stepId', lazy: () => import('../screens/profile/ProfileEditStepScreen').then((m) => ({ Component: m.ProfileEditStepScreen })) },
        ],
      },

      // Hidden developer panel: reachable in any state.
      { path: ROUTES.debug, lazy: () => import('../screens/debug/DebugScreen').then((m) => ({ Component: m.DebugScreen })) },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);
