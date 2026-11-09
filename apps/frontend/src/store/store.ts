import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/services/baseApi';
import { uiSlice } from '@/store/uiSlice';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [uiSlice.name]: uiSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * Creates a new store. Never share one module-level store: on the server that
 * would leak state between requests. StoreProvider creates one per provider
 * instance, and tests create one per test.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
