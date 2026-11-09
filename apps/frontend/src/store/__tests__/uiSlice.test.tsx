import { render, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { makeStore } from '../store';
import { StoreProvider } from '../StoreProvider';
import { initialUiState, setActiveOrg, setMobileNavOpen, uiSlice } from '../uiSlice';

describe('ui slice', () => {
  beforeEach(() => localStorage.clear());

  it('updates the active organisation and the mobile nav state', () => {
    let state = uiSlice.reducer(undefined, setActiveOrg('org1'));
    state = uiSlice.reducer(state, setMobileNavOpen(true));
    expect(state).toEqual({ activeOrgId: 'org1', mobileNavOpen: true });
  });

  it('has a deterministic initial state (no storage reads), so server and client match', () => {
    localStorage.setItem('fg:activeOrgId', 'org9');
    expect(makeStore().getState().ui).toEqual(initialUiState);
  });
});

describe('StoreProvider', () => {
  beforeEach(() => localStorage.clear());

  it('restores the persisted organisation after mount', async () => {
    localStorage.setItem('fg:activeOrgId', 'org42');
    const store = makeStore();
    render(<StoreProvider store={store}>x</StoreProvider>);
    await waitFor(() => expect(store.getState().ui.activeOrgId).toBe('org42'));
  });

  it('persists and clears the active organisation', async () => {
    const store = makeStore();
    render(<StoreProvider store={store}>x</StoreProvider>);
    await waitFor(() => expect(store.getState().ui.activeOrgId).toBeNull());

    store.dispatch(setActiveOrg('org1'));
    expect(localStorage.getItem('fg:activeOrgId')).toBe('org1');
    store.dispatch(setActiveOrg(null));
    expect(localStorage.getItem('fg:activeOrgId')).toBeNull();
  });

  it('creates a separate store per provider instance (no state shared between requests)', () => {
    const a = makeStore();
    const b = makeStore();
    a.dispatch(setActiveOrg('org1'));
    expect(b.getState().ui.activeOrgId).toBeNull();
  });

  it('renders on the server without accessing storage', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem');
    renderToString(<StoreProvider>ok</StoreProvider>);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
