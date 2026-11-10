import { isPermission, resolveOrgPermissions, type Capability, type OrgRole } from '@fitgeng/shared';
import { MANAGE_MODULES, allowedModuleKeys, buildNavSections } from '../modules';

const sectionsFor = (caps: Capability[], role: OrgRole) =>
  buildNavSections(allowedModuleKeys(resolveOrgPermissions(caps, role))).map((s) => s.section);

const keysFor = (caps: Capability[], role: OrgRole) => allowedModuleKeys(resolveOrgPermissions(caps, role));

describe('management module registry', () => {
  it('has unique keys and valid permissions', () => {
    const keys = MANAGE_MODULES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
    MANAGE_MODULES.forEach((m) => expect(isPermission(m.permission)).toBe(true));
  });

  it('keeps training groups, teams, training sessions, events and competitions as separate modules', () => {
    const byKey = Object.fromEntries(MANAGE_MODULES.map((m) => [m.key, m]));
    expect(byKey.groups?.section).toBe('people');
    expect(byKey.teams?.section).toBe('people');
    expect(byKey.sessions?.section).toBe('training');
    expect(byKey.events?.section).toBe('community');
    expect(byKey.competitions?.section).toBe('competition');
  });

  it('shows a coach the shared modules plus coaching, without competitions', () => {
    const sections = sectionsFor(['player', 'coach'], 'owner');
    expect(sections).toEqual(['people', 'training', 'coaching', 'finance', 'community', 'organisation']);
    expect(keysFor(['player', 'coach'], 'owner')).toEqual(expect.arrayContaining(['players', 'groups', 'teams', 'attendance', 'programmes']));
  });

  it('shows an organiser the shared modules plus competitions, without coaching', () => {
    expect(sectionsFor(['player', 'organiser'], 'owner')).toEqual([
      'people',
      'training',
      'competition',
      'finance',
      'community',
      'organisation',
    ]);
  });

  it('combines both families for a coach-and-organiser in one navigation', () => {
    expect(sectionsFor(['coach', 'organiser'], 'admin')).toEqual(expect.arrayContaining(['coaching', 'competition']));
  });

  it('gives an org-appointed coach training and coaching tools but not finance or settings', () => {
    const keys = keysFor(['player'], 'coach');
    expect(keys).toEqual(expect.arrayContaining(['sessions', 'attendance', 'assessments']));
    expect(keys).not.toContain('payments');
    expect(keys).not.toContain('settings');
    expect(keys).not.toContain('fixtures');
  });

  it('drops empty sections', () => {
    expect(buildNavSections([])).toEqual([]);
    expect(buildNavSections(['payments'])).toEqual([expect.objectContaining({ section: 'finance' })]);
  });
});
