import { filterNav, manageNav } from '../navigation';

const labels = (caps: Parameters<typeof filterNav>[1]) => filterNav(manageNav, caps).map((i) => i.label);

describe('management navigation filtering', () => {
  it('shows coach tools to coaches but not organiser-only items', () => {
    const items = labels(['player', 'coach']);
    expect(items).toEqual(expect.arrayContaining(['Schedules', 'Attendance', 'Payments', 'Groups']));
    expect(items).not.toContain('Teams');
  });

  it('shows teams and events to organisers but not coach-only tools', () => {
    const items = labels(['organiser']);
    expect(items).toEqual(expect.arrayContaining(['Teams', 'Events', 'Groups']));
    expect(items).not.toContain('Attendance');
    expect(items).not.toContain('Schedules');
  });

  it('combines capabilities for users who are both', () => {
    const items = labels(['coach', 'organiser']);
    expect(items).toEqual(expect.arrayContaining(['Teams', 'Attendance']));
  });

  it('shows a player only the unrestricted items', () => {
    expect(labels(['player'])).toEqual(['Dashboard', 'Players', 'Posts', 'Settings']);
  });
});
