import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Global UI state that several parts of the app need. Server data belongs in
 * RTK Query, not here.
 *
 * The initial state is deterministic (no browser storage reads), so server and
 * client renders match. StoreProvider restores persisted values after mount.
 */
export interface UiState {
  /** Organisation currently selected in the management dashboard. */
  activeOrgId: string | null;
  mobileNavOpen: boolean;
}

export const ACTIVE_ORG_KEY = 'fg:activeOrgId';

export const initialUiState: UiState = {
  activeOrgId: null,
  mobileNavOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    setActiveOrg(state, action: PayloadAction<string | null>) {
      state.activeOrgId = action.payload;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
  },
});

export const { setActiveOrg, setMobileNavOpen } = uiSlice.actions;
