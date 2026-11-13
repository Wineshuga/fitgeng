import type { Permission } from '@fitgeng/shared';
import type { IconName } from '@/components/Icon';

/**
 * Management module registry: every feature of the /manage application.
 *
 * Adding a capability means adding an entry here (and, once built, a route
 * folder at app/(manage)/manage/[org]/<key>). It never means a new dashboard.
 * Navigation, route protection and the org switcher all read this list, and
 * visibility always comes from the shared permission model.
 *
 * Concepts stay distinct:
 *   groups   = training groups (ongoing membership, coached)
 *   teams    = competitive squads (rosters that play fixtures)
 *   sessions = training occurrences generated from schedules
 *   events   = one-off activities (friendlies, meetups, community games)
 *   competitions = multi-fixture structures (tournaments, leagues)
 */

export type ModuleSection = 'people' | 'training' | 'coaching' | 'competition' | 'finance' | 'community' | 'organisation';

export interface ModuleAvailability {
  status: 'available' | 'planned';
  /** Delivery phase, shown on the placeholder until the module ships. */
  phase: string;
}

export interface ManageModule {
  /** URL segment: /manage/<org>/<key>. */
  key: string;
  label: string;
  description: string;
  icon: IconName;
  section: ModuleSection;
  /** Shown only to users holding this permission in the current organisation. The API enforces it separately. */
  permission: Permission;
  availability: ModuleAvailability;
}

export const SECTION_LABELS: Record<ModuleSection, string> = {
  people: 'Players & squads',
  training: 'Training',
  coaching: 'Coaching',
  competition: 'Competitions',
  finance: 'Finance',
  community: 'Community',
  organisation: 'Organisation',
};

/** Section order in the navigation. */
export const SECTION_ORDER: ModuleSection[] = ['people', 'training', 'coaching', 'competition', 'finance', 'community', 'organisation'];

const planned = (phase: string): ModuleAvailability => ({ status: 'planned', phase });

export const MANAGE_MODULES: readonly ManageModule[] = [
  // People & squads
  { key: 'players', label: 'Players', description: 'Roster, invitations and membership status.', icon: 'users', section: 'people', permission: 'players.manage', availability: planned('Phase 3a') },
  { key: 'groups', label: 'Training groups', description: 'Coached groups with ongoing membership.', icon: 'users', section: 'people', permission: 'groups.manage', availability: planned('Phase 3a') },
  { key: 'teams', label: 'Teams', description: 'Competitive squads and their rosters.', icon: 'shield', section: 'people', permission: 'teams.manage', availability: planned('Phase 3a') },

  // Training
  { key: 'schedules', label: 'Schedules', description: 'Recurring training timetables for groups or individual players.', icon: 'calendar', section: 'training', permission: 'schedules.manage', availability: planned('Phase 3b') },
  { key: 'sessions', label: 'Training sessions', description: 'Upcoming and past training occurrences.', icon: 'clock', section: 'training', permission: 'sessions.manage', availability: planned('Phase 3b') },
  { key: 'attendance', label: 'Attendance', description: 'Mark and review attendance per session.', icon: 'check', section: 'training', permission: 'attendance.manage', availability: planned('Phase 3b') },

  // Coaching (coach capability, or the organisation's coach role)
  { key: 'programmes', label: 'Training programmes', description: 'Structured curricula and drills for groups.', icon: 'clipboard', section: 'coaching', permission: 'programmes.manage', availability: planned('Phase 3d') },
  { key: 'assessments', label: 'Assessments', description: 'Evaluate players against skill criteria.', icon: 'star', section: 'coaching', permission: 'assessments.manage', availability: planned('Phase 3d') },
  { key: 'progression', label: 'Skill progression', description: 'Track each player’s development over time.', icon: 'trending', section: 'coaching', permission: 'progression.manage', availability: planned('Phase 3d') },
  { key: 'graduation', label: 'Graduation', description: 'Move players to the next level or mark them graduated.', icon: 'graduation', section: 'coaching', permission: 'graduation.manage', availability: planned('Phase 3a') },

  // Competitions (organiser capability)
  { key: 'competitions', label: 'Competitions', description: 'Tournaments and leagues.', icon: 'trophy', section: 'competition', permission: 'competitions.manage', availability: planned('Phase 5b') },
  { key: 'fixtures', label: 'Fixtures', description: 'Match schedule between teams.', icon: 'list', section: 'competition', permission: 'fixtures.manage', availability: planned('Phase 5b') },
  { key: 'results', label: 'Results', description: 'Record match scores and outcomes.', icon: 'scoreboard', section: 'competition', permission: 'results.manage', availability: planned('Phase 5b') },
  { key: 'standings', label: 'Standings', description: 'League tables computed from results.', icon: 'table', section: 'competition', permission: 'standings.manage', availability: planned('Phase 5b') },

  // Finance
  { key: 'payments', label: 'Payments', description: 'Fee plans, charges, recorded payments and balances.', icon: 'wallet', section: 'finance', permission: 'payments.manage', availability: planned('Phase 3c') },

  // Community
  { key: 'events', label: 'Events', description: 'Friendlies, meetups and community games, with registrations.', icon: 'flag', section: 'community', permission: 'events.manage', availability: planned('Phase 5a') },
  { key: 'posts', label: 'Posts', description: 'Announcements and recruitment posts.', icon: 'megaphone', section: 'community', permission: 'posts.manage', availability: planned('Phase 5a') },

  // Organisation
  { key: 'settings', label: 'Settings', description: 'Organisation profile, members and roles.', icon: 'settings', section: 'organisation', permission: 'org.settings', availability: planned('Phase 3a') },
];

export function getModule(key: string): ManageModule | undefined {
  return MANAGE_MODULES.find((m) => m.key === key);
}

/** Module keys the holder of these permissions may see. */
export function allowedModuleKeys(permissions: readonly Permission[]): string[] {
  return MANAGE_MODULES.filter((m) => permissions.includes(m.permission)).map((m) => m.key);
}

export interface NavSection {
  section: ModuleSection;
  label: string;
  modules: ManageModule[];
}

/** Groups allowed modules into ordered navigation sections, dropping empty sections. */
export function buildNavSections(allowedKeys: readonly string[]): NavSection[] {
  return SECTION_ORDER.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    modules: MANAGE_MODULES.filter((m) => m.section === section && allowedKeys.includes(m.key)),
  })).filter((s) => s.modules.length > 0);
}
