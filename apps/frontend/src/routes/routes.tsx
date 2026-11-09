import type { RouteObject } from 'react-router';
import { PublicLayout } from '@/layouts/PublicLayout';
import { PlayerLayout } from '@/layouts/PlayerLayout';
import { ManageLayout } from '@/layouts/ManageLayout';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UpcomingFeaturePage } from '@/pages/UpcomingFeaturePage';
import { manageNav, playerNav } from './navigation';

/**
 * Route tree. Auth guards (RequireAuth, RequireCapability) wrap /app and
 * /manage in Phase 2. Each placeholder is replaced when its feature is built.
 */
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },
  {
    path: '/app',
    element: <PlayerLayout />,
    children: playerNav.map((item) =>
      item.to === '/app'
        ? { index: true, element: <UpcomingFeaturePage title="Home" phase={4} /> }
        : { path: item.to.replace('/app/', ''), element: <UpcomingFeaturePage title={item.label} phase={4} /> },
    ),
  },
  {
    path: '/manage',
    element: <ManageLayout />,
    children: manageNav.map((item) =>
      item.to === '/manage'
        ? { index: true, element: <UpcomingFeaturePage title="Dashboard" phase={3} /> }
        : { path: item.to.replace('/manage/', ''), element: <UpcomingFeaturePage title={item.label} phase={3} /> },
    ),
  },
  { path: '*', element: <NotFoundPage /> },
];
