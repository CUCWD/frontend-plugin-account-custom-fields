// These plain action objects preserve the account MFE's Redux vocabulary without
// requiring Redux; store.js passes them directly to the local reducer.
// Group asynchronous action phases so each service request has an explicit lifecycle.
// Namespaced string values prevent collisions if these actions are ever logged
// alongside actions from the host application.
export const FETCH_CUSTOM_FIELDS = Object.freeze({
  BEGIN: 'CUSTOM_FIELDS/FETCH_BEGIN',
  SUCCESS: 'CUSTOM_FIELDS/FETCH_SUCCESS',
  FAILURE: 'CUSTOM_FIELDS/FETCH_FAILURE',
});

export const SAVE_CUSTOM_FIELD = Object.freeze({
  BEGIN: 'CUSTOM_FIELDS/SAVE_BEGIN',
  SUCCESS: 'CUSTOM_FIELDS/SAVE_SUCCESS',
  FAILURE: 'CUSTOM_FIELDS/SAVE_FAILURE',
  RESET: 'CUSTOM_FIELDS/SAVE_RESET',
});

export const OPEN_CUSTOM_FORM = 'CUSTOM_FIELDS/OPEN_FORM';
export const CLOSE_CUSTOM_FORM = 'CUSTOM_FIELDS/CLOSE_FORM';
export const UPDATE_CUSTOM_DRAFT = 'CUSTOM_FIELDS/UPDATE_DRAFT';
export const RESET_CUSTOM_DRAFTS = 'CUSTOM_FIELDS/RESET_DRAFTS';

// Keep payload construction here so sagas.js and reducers.js share one contract.
export const fetchCustomFieldsBegin = () => ({ type: FETCH_CUSTOM_FIELDS.BEGIN });

export const fetchCustomFieldsSuccess = payload => ({
  type: FETCH_CUSTOM_FIELDS.SUCCESS,
  payload,
});

export const fetchCustomFieldsFailure = error => ({
  type: FETCH_CUSTOM_FIELDS.FAILURE,
  payload: { error },
});

export const openCustomForm = formId => ({
  type: OPEN_CUSTOM_FORM,
  payload: { formId },
});

export const closeCustomForm = formId => ({
  type: CLOSE_CUSTOM_FORM,
  payload: { formId },
});

export const updateCustomDraft = (name, value) => ({
  type: UPDATE_CUSTOM_DRAFT,
  payload: { name, value },
});

// Reset all drafts when the entire editing session must be discarded. Normal
// Cancel and Save flows remove only the draft for the affected field.
export const resetCustomDrafts = () => ({ type: RESET_CUSTOM_DRAFTS });

export const saveCustomFieldBegin = name => ({
  type: SAVE_CUSTOM_FIELD.BEGIN,
  payload: { name },
});

// Include the field name so the reducer can remove only its committed draft.
export const saveCustomFieldSuccess = (name, response) => ({
  type: SAVE_CUSTOM_FIELD.SUCCESS,
  payload: { name, response },
});

export const saveCustomFieldFailure = (name, errors) => ({
  type: SAVE_CUSTOM_FIELD.FAILURE,
  payload: { name, errors },
});

export const saveCustomFieldReset = name => ({
  type: SAVE_CUSTOM_FIELD.RESET,
  payload: { name },
});
