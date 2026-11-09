import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Global UI state that several parts of the app need. Server data belongs in
 * RTK Query, not here.
 */
export interface UiState {
  /** Organisation currently selected in the management dashboard. */
  activeOrgId: string | null;
  mobileNavOpen: boolean;
}

const ACTIVE_ORG_KEY = 'fg:activeOrgId';

function readActiveOrg(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY);
  } catch {
    return null;
  }
}

export const initialUiState = (): UiState => ({
  activeOrgId: readActiveOrg(),
  mobileNavOpen: false,
});

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
export { ACTIVE_ORG_KEY };
