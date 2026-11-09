/** Global capabilities a user can hold in any combination. */
export const CAPABILITIES = ['player', 'coach', 'organiser'] as const;
export type Capability = (typeof CAPABILITIES)[number];

/** Capabilities that require platform-admin approval. */
export const REQUESTABLE_CAPABILITIES = ['coach', 'organiser'] as const;
export type RequestableCapability = (typeof REQUESTABLE_CAPABILITIES)[number];

/** Roles scoped to a single organisation. */
export const ORG_ROLES = ['owner', 'admin', 'coach'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Staff roles scoped to a single group or team. */
export const GROUP_STAFF_ROLES = ['coach', 'manager'] as const;
export type GroupStaffRole = (typeof GROUP_STAFF_ROLES)[number];
