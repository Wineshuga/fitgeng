import { playerNav, playerSections } from '../navigation';

describe('player navigation', () => {
  it('keeps Discover public and the rest under /player', () => {
    expect(playerNav.find((i) => i.label === 'Discover')?.to).toBe('/discover');
    expect(playerSections.map((s) => s.to)).toEqual(['/player/groups', '/player/schedule', '/player/profile', '/player/payments']);
  });
});
