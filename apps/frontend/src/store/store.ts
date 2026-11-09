import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/services/baseApi';
import { ACTIVE_ORG_KEY, uiSlice } from '@/store/uiSlice';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [uiSlice.name]: uiSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  setupListeners(store.dispatch);

  // Persist only the active organisation; everything else is re-fetched.
  let lastOrg = store.getState().ui.activeOrgId;
  store.subscribe(() => {
    const next = store.getState().ui.activeOrgId;
    if (next === lastOrg) return;
    lastOrg = next;
    try {
      if (next) localStorage.setItem(ACTIVE_ORG_KEY, next);
      else localStorage.removeItem(ACTIVE_ORG_KEY);
    } catch {
      /* storage unavailable */
    }
  });
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
