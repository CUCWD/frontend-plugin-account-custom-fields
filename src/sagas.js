import {
  closeCustomForm,
  fetchCustomFieldsBegin,
  fetchCustomFieldsFailure,
  fetchCustomFieldsSuccess,
  saveCustomFieldBegin,
  saveCustomFieldFailure,
  saveCustomFieldSuccess,
} from './actions';
import { getCustomFields, patchCustomFields } from './service';

// This module is named sagas.js to preserve the organization used previously
// in frontend-app-account and make code transitions easier. It does not use
// Redux Saga, generator effects, or middleware. The async handlers receive the
// plugin's local dispatch and getState functions from store.js.
export const createCustomFieldHandlers = ({ dispatch, getState }) => {
  // Dependency injection avoids a circular import back to store.js and keeps
  // these workflows usable with the plugin's small external store.
  /** Share one successful load per module instance; failed loads can be retried. */
  const handleFetchCustomFields = async () => {
    const state = getState();
    if (state.loading || state.loaded) {
      return;
    }
    // Set loading before awaiting HTTP so simultaneous widget mounts cannot duplicate GETs.
    dispatch(fetchCustomFieldsBegin());
    try {
      dispatch(fetchCustomFieldsSuccess(await getCustomFields()));
    } catch (error) {
      // Convert request rejection into UI state; callers do not need their own catch.
      dispatch(fetchCustomFieldsFailure(error.message));
    }
  };

  /** Save one editor value and expose validation errors through the shared state. */
  const handleSaveCustomField = async (name, value) => {
    dispatch(saveCustomFieldBegin(name));
    try {
      const response = await patchCustomFields({ [name]: value });
      dispatch(saveCustomFieldSuccess(name, response));
      // Show the completed save state briefly; callers need not await the close delay.
      setTimeout(() => dispatch(closeCustomForm(name)), 1000);
    } catch (error) {
      // Unexpected failures still set the button's error state without inventing field errors.
      // As with fetch, the handler resolves after recording failure in shared state.
      dispatch(saveCustomFieldFailure(name, error.fieldErrors || {}));
    }
  };

  return { handleFetchCustomFields, handleSaveCustomField };
};
