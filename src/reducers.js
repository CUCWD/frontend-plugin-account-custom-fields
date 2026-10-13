import { CUSTOM_ACCOUNT_FIELDS } from './service';
import {
  CLOSE_CUSTOM_FORM,
  FETCH_CUSTOM_FIELDS,
  OPEN_CUSTOM_FORM,
  RESET_CUSTOM_DRAFTS,
  SAVE_CUSTOM_FIELD,
  UPDATE_CUSTOM_DRAFT,
} from './actions';

// This is a Redux-style pure reducer, but it is invoked by this plugin's small
// external store rather than by Redux or the host MFE's Redux provider.

export const DEFAULT_CUSTOM_FIELD_VISIBILITY = 'optional';

// Missing or unknown visibility defaults to optional for every supported field.
export const normalizeCustomFieldVisibility = (visibility = {}) => {
  const normalizedVisibility = {};
  CUSTOM_ACCOUNT_FIELDS.forEach((fieldName) => {
    const fieldVisibility = visibility[fieldName];
    normalizedVisibility[fieldName] = ['required', 'optional', 'hidden'].includes(fieldVisibility)
      ? fieldVisibility
      : DEFAULT_CUSTOM_FIELD_VISIBILITY;
  });
  return normalizedVisibility;
};

// Committed values and drafts stay separate so cancel can discard unsaved edits.
// Open editors and save states are tracked per field across both plugin slots.
export const defaultState = {
  loading: false,
  loaded: false,
  loadingError: null,
  values: {},
  drafts: {},
  openFormIds: [],
  saveStates: {},
  errors: {},
  options: {},
  visibility: normalizeCustomFieldVisibility(),
};

// Accept nested values or a flat response, excluding metadata from flat values.
// hasOwnProperty preserves intentional false, null, and empty-string values.
export const getCustomValues = (data) => data.values || CUSTOM_ACCOUNT_FIELDS.reduce((acc, fieldName) => {
  if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
    acc[fieldName] = data[fieldName];
  }
  return acc;
}, {});

// Return a new keyed object without one field so unrelated field state survives.
const removeField = (fields, name) => {
  const remainingFields = { ...fields };
  delete remainingFields[name];
  return remainingFields;
};

// Keep state transitions synchronous; sagas.js owns requests and timers, while
// store.js owns dispatch and subscriber notification.
export const reducer = (state = defaultState, action = {}) => {
  switch (action.type) {
    case FETCH_CUSTOM_FIELDS.BEGIN:
      // The same guard used by the async handler makes duplicate begin actions harmless.
      if (state.loading || state.loaded) {
        return state;
      }
      return {
        ...state, loading: true, loaded: false, loadingError: null,
      };
    // Visibility and choices come only from the backend's metadata envelope;
    // similarly named top-level keys are not treated as configuration.
    case FETCH_CUSTOM_FIELDS.SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        loadingError: null,
        values: { ...state.values, ...getCustomValues(action.payload) },
        options: action.payload.metadata?.options || {},
        visibility: normalizeCustomFieldVisibility(action.payload.metadata?.visibility || {}),
      };
    case FETCH_CUSTOM_FIELDS.FAILURE:
      return {
        ...state, loading: false, loaded: false, loadingError: action.payload.error,
      };
    // Opening a field leaves existing editors and drafts active.
    case OPEN_CUSTOM_FORM: {
      const { formId } = action.payload;
      return {
        ...state,
        openFormIds: state.openFormIds.includes(formId)
          ? state.openFormIds
          : [...state.openFormIds, formId],
        saveStates: removeField(state.saveStates, formId),
        errors: removeField(state.errors, formId),
      };
    }
    // Cancel or delayed save completion closes only the named editor and
    // discards only its draft, status, and validation error.
    case CLOSE_CUSTOM_FORM: {
      const { formId } = action.payload;
      if (!state.openFormIds.includes(formId)) {
        return state;
      }
      return {
        ...state,
        openFormIds: state.openFormIds.filter(id => id !== formId),
        saveStates: removeField(state.saveStates, formId),
        errors: removeField(state.errors, formId),
        drafts: removeField(state.drafts, formId),
      };
    }
    // Editing after a failed save clears feedback so the corrected value can be retried.
    case UPDATE_CUSTOM_DRAFT: {
      const { name, value } = action.payload;
      return {
        ...state,
        drafts: { ...state.drafts, [name]: value },
        saveStates: removeField(state.saveStates, name),
        errors: removeField(state.errors, name),
      };
    }
    case RESET_CUSTOM_DRAFTS:
      // This leaves the committed values untouched so the UI returns to saved data.
      return { ...state, drafts: {} };
    case SAVE_CUSTOM_FIELD.BEGIN: {
      const { name } = action.payload;
      return {
        ...state,
        saveStates: { ...state.saveStates, [name]: 'pending' },
        errors: removeField(state.errors, name),
      };
    }
    // PATCH may omit unchanged values and metadata; retain the previously loaded
    // data and remove only the draft whose value was successfully committed.
    case SAVE_CUSTOM_FIELD.SUCCESS: {
      const { name, response } = action.payload;
      return {
        ...state,
        saveStates: { ...state.saveStates, [name]: 'complete' },
        values: { ...state.values, ...getCustomValues(response) },
        drafts: removeField(state.drafts, name),
        errors: removeField(state.errors, name),
        options: response.metadata?.options || state.options,
        visibility: normalizeCustomFieldVisibility(response.metadata?.visibility || state.visibility),
      };
    }
    case SAVE_CUSTOM_FIELD.FAILURE:
      return {
        ...state,
        saveStates: { ...state.saveStates, [action.payload.name]: 'error' },
        errors: { ...state.errors, ...action.payload.errors },
      };
    case SAVE_CUSTOM_FIELD.RESET:
      return {
        ...state,
        saveStates: removeField(state.saveStates, action.payload.name),
        errors: removeField(state.errors, action.payload.name),
      };
    default:
      return state;
  }
};
