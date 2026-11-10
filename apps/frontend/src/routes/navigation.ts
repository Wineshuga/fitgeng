import type { IconName } from '@/components/Icon';

export interface NavItem {
  label: string;
  to: string;
  icon: IconName;
}

/**
 * Player app tabs. The first five form the mobile bottom bar.
 * Management navigation is permission-driven and lives in features/manage/modules.ts.
 */
export const playerNav: NavItem[] = [
  { label: 'Home', to: '/player', icon: 'home' },
  // Discover is a public, search-indexed page shared by visitors and players.
  { label: 'Discover', to: '/discover', icon: 'compass' },
  { label: 'My Groups', to: '/player/groups', icon: 'users' },
  { label: 'Schedule', to: '/player/schedule', icon: 'calendar' },
  { label: 'Profile', to: '/player/profile', icon: 'user' },
  { label: 'Payments', to: '/player/payments', icon: 'wallet' },
];

/** Player sections reached under /player/<segment>, used by the dynamic route. */
export const playerSections = playerNav.filter((i) => i.to.startsWith('/player/'));
