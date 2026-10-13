import { useEffect, useSyncExternalStore } from 'react';

import { defaultState, reducer } from './reducers';
import {
  closeCustomForm,
  openCustomForm,
  updateCustomDraft,
} from './actions';
import { createCustomFieldHandlers } from './sagas';

// This module fills the state, dispatch, and subscription roles of a Redux
// store. It stays local so the plugin does not depend on the host MFE's
// internal store or React Redux provider.
// Both account plugin slots subscribe to the same state through useSyncExternalStore.
// ES module caching makes this state a singleton for one loaded plugin bundle.
let state = defaultState;
const listeners = new Set();
// Dispatch follows the Redux data flow—action to reducer to subscribers—but is
// intentionally small because this plugin owns only one feature state tree.
// Reducer snapshots remain stable between dispatches for useSyncExternalStore.
const dispatch = (action) => {
  state = reducer(state, action);
  listeners.forEach(listener => listener());
};

// Bind the saga-style async handlers to this module's small external store.
export const {
  handleFetchCustomFields,
  handleSaveCustomField,
} = createCustomFieldHandlers({ dispatch, getState: () => state });

/** Subscribe a slot widget to shared data and provide its editing callbacks. */
export function useCustomFields() {
  const snapshot = useSyncExternalStore(listener => {
    listeners.add(listener);
    // Slot widgets can unmount independently; remove only this subscription.
    return () => listeners.delete(listener);
  }, () => state);

  // Every slot asks to load on mount; the handler's loading/loaded guard reduces
  // those requests to one successful fetch for the shared module instance.
  useEffect(() => { handleFetchCustomFields(); }, []);

  return {
    ...snapshot,
    // Object spread checks key presence rather than truthiness, so drafts override
    // committed values even when the draft is empty, false, null, or undefined.
    formValues: { ...snapshot.values, ...snapshot.drafts },
    open: formId => dispatch(openCustomForm(formId)),
    close: formId => dispatch(closeCustomForm(formId)),
    change: (name, value) => dispatch(updateCustomDraft(name, value)),
    // Keep the component-facing callback concise while naming the orchestrator
    // consistently with the handlers previously implemented as sagas.
    save: handleSaveCustomField,
  };
}
