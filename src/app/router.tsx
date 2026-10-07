import { createHashRouter, Navigate, Outlet } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { DebugScreen } from '../screens/debug/DebugScreen';
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
import { OnboardingPreviewScreen } from '../screens/onboarding/OnboardingPreviewScreen';
import { OnboardingStepScreen } from '../screens/onboarding/OnboardingStepScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { ProfileEditStepScreen } from '../screens/profile/ProfileEditStepScreen';
import { ProfilePreviewScreen } from '../screens/profile/ProfilePreviewScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotFoundScreen } from '../screens/system/NotFoundScreen';
import { RouteError } from '../screens/system/RouteError';
import { SessionGate } from '../screens/system/SessionGate';
import { ONBOARDING_ROUTES, ROUTES } from './navigation';

/**
 * Hash routing (`/#/discover`) works on GitHub Pages with no server rewrites:
 * refreshing or deep-linking any screen always loads index.html.
 */
export const router = createHashRouter([
  {
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to={ROUTES.discover} replace /> },

      // Not finished onboarding yet.
      {
        element: <SessionGate mode="guest" />,
        children: [
          { path: ONBOARDING_ROUTES.welcome, element: <WelcomeScreen /> },
          { path: ONBOARDING_ROUTES.preview, element: <OnboardingPreviewScreen /> },
          { path: '/onboarding/:stepId', element: <OnboardingStepScreen /> },
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
          { path: '/profile/edit/:stepId', element: <ProfileEditStepScreen /> },
        ],
      },

      // Hidden developer panel: reachable in any state.
      { path: ROUTES.debug, element: <DebugScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);
