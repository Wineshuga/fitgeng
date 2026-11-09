import { makeStore } from '@/app/store';
import { setActiveOrg, setMobileNavOpen, uiSlice } from '../uiSlice';

describe('ui slice', () => {
  beforeEach(() => localStorage.clear());

  it('updates the active organisation and the mobile nav state', () => {
    let state = uiSlice.reducer(undefined, setActiveOrg('org1'));
    state = uiSlice.reducer(state, setMobileNavOpen(true));
    expect(state).toEqual({ activeOrgId: 'org1', mobileNavOpen: true });
  });

  it('persists the active organisation across store instances', () => {
    makeStore().dispatch(setActiveOrg('org42'));
    expect(localStorage.getItem('fg:activeOrgId')).toBe('org42');
    expect(makeStore().getState().ui.activeOrgId).toBe('org42');
  });

  it('clears the persisted organisation', () => {
    const store = makeStore();
    store.dispatch(setActiveOrg('org1'));
    store.dispatch(setActiveOrg(null));
    expect(localStorage.getItem('fg:activeOrgId')).toBeNull();
  });
});
