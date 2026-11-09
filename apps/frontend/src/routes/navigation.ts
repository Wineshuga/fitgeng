import type { Capability } from '@fitgeng/shared';
import type { IconName } from '@/components/Icon';

export interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  /** Users with any of these capabilities see the item. Omit to show it to everyone in the layout. */
  requires?: Capability[];
}

/** Player app tabs. The first five form the mobile bottom bar. */
export const playerNav: NavItem[] = [
  { label: 'Home', to: '/player', icon: 'home' },
  // Discover is a public, search-indexed page shared by visitors and players.
  { label: 'Discover', to: '/discover', icon: 'compass' },
  { label: 'My Groups', to: '/player/groups', icon: 'users' },
  { label: 'Schedule', to: '/player/schedule', icon: 'calendar' },
  { label: 'Profile', to: '/player/profile', icon: 'user' },
  { label: 'Payments', to: '/player/payments', icon: 'wallet' },
];

/**
 * Management dashboard sections. Filtering by capability only affects what the
 * UI shows; the backend enforces access on every request (architecture §3.3).
 */
export const manageNav: NavItem[] = [
  { label: 'Dashboard', to: '/manage', icon: 'grid' },
  { label: 'Players', to: '/manage/players', icon: 'users' },
  { label: 'Groups', to: '/manage/groups', icon: 'users', requires: ['coach', 'organiser'] },
  { label: 'Teams', to: '/manage/teams', icon: 'trophy', requires: ['organiser'] },
  { label: 'Schedules', to: '/manage/schedules', icon: 'calendar', requires: ['coach'] },
  { label: 'Attendance', to: '/manage/attendance', icon: 'check', requires: ['coach'] },
  { label: 'Payments', to: '/manage/payments', icon: 'wallet', requires: ['coach', 'organiser'] },
  { label: 'Posts', to: '/manage/posts', icon: 'megaphone' },
  { label: 'Events', to: '/manage/events', icon: 'trophy', requires: ['coach', 'organiser'] },
  { label: 'Settings', to: '/manage/settings', icon: 'settings' },
];

export function filterNav(items: NavItem[], capabilities: readonly Capability[]): NavItem[] {
  return items.filter((item) => !item.requires || item.requires.some((c) => capabilities.includes(c)));
}
