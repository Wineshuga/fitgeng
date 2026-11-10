import type { Capability, OrgRole } from './constants/capabilities';

/**
 * Management permissions: the single source of truth for what a user may do
 * inside one organisation. The backend enforces them (requireOrgPermission), and
 * the frontend uses the same function only to decide what to show.
 *
 * A user's permissions in an organisation come from two independent inputs:
 *   1. their role in that organisation (owner / admin / coach), which grants a set of permissions
 *   2. their global capabilities (player / coach / organiser), which unlock whole families
 *
 * Effective permissions = the role's grants ∩ the families the user has unlocked.
 * So capabilities combine freely: a coach-and-organiser owner gets both families,
 * and nobody needs a separate dashboard.
 */

export type PermissionFamily = 'core' | 'coaching' | 'competition';

export const PERMISSIONS = {
  // Core: shared by coaches and organisers.
  'dashboard.view': 'core',
  'org.settings': 'core',
  'players.manage': 'core',
  'groups.manage': 'core',
  'teams.manage': 'core',
  'schedules.manage': 'core',
  'sessions.manage': 'core',
  'attendance.manage': 'core',
  'payments.manage': 'core',
  'posts.manage': 'core',
  'events.manage': 'core',
  // Coaching: player development.
  'programmes.manage': 'coaching',
  'assessments.manage': 'coaching',
  'progression.manage': 'coaching',
  'graduation.manage': 'coaching',
  // Competition: structured competitive play.
  'competitions.manage': 'competition',
  'fixtures.manage': 'competition',
  'results.manage': 'competition',
  'standings.manage': 'competition',
} as const satisfies Record<string, PermissionFamily>;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/** What each organisation role may do, before capability families are applied. */
const ROLE_GRANTS: Record<OrgRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  // A coach hired into an organisation runs training. Money, organisation settings
  // and competition admin stay with owners and admins. Which groups a coach may
  // touch is a per-record check (group staff), not a permission.
  coach: [
    'dashboard.view',
    'players.manage',
    'groups.manage',
    'teams.manage',
    'schedules.manage',
    'sessions.manage',
    'attendance.manage',
    'posts.manage',
    'events.manage',
    'programmes.manage',
    'assessments.manage',
    'progression.manage',
    'graduation.manage',
  ],
};

/** Whether a permission family is unlocked for this user in this role. */
function familyUnlocked(family: PermissionFamily, capabilities: readonly Capability[], role: OrgRole): boolean {
  switch (family) {
    case 'core':
      return true;
    case 'coaching':
      // A global coach, or someone the organisation has made one of its coaches.
      return capabilities.includes('coach') || role === 'coach';
    case 'competition':
      return capabilities.includes('organiser');
  }
}

/** Effective permissions of a user inside one organisation. */
export function resolveOrgPermissions(capabilities: readonly Capability[], role: OrgRole): Permission[] {
  return ROLE_GRANTS[role].filter((p) => familyUnlocked(PERMISSIONS[p], capabilities, role));
}

export function hasOrgPermission(capabilities: readonly Capability[], role: OrgRole, permission: Permission): boolean {
  return resolveOrgPermissions(capabilities, role).includes(permission);
}

export function isPermission(value: string): value is Permission {
  return Object.hasOwn(PERMISSIONS, value);
}
