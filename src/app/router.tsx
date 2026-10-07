import { createHashRouter, Navigate } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { DebugScreen } from '../screens/debug/DebugScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { LikesScreen } from '../screens/likes/LikesScreen';
import { MatchesScreen } from '../screens/matches/MatchesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotFoundScreen } from '../screens/system/NotFoundScreen';
import { RouteError } from '../screens/system/RouteError';
import { ROUTES } from './navigation';

/**
 * Hash routing (`/#/discover`) works on GitHub Pages with no server rewrites:
 * refreshing or deep-linking any screen always loads index.html.
 */
export const router = createHashRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to={ROUTES.discover} replace /> },
      { path: ROUTES.discover, element: <DiscoverScreen /> },
      { path: ROUTES.likes, element: <LikesScreen /> },
      { path: ROUTES.matches, element: <MatchesScreen /> },
      { path: ROUTES.profile, element: <ProfileScreen /> },
      { path: ROUTES.debug, element: <DebugScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]);
