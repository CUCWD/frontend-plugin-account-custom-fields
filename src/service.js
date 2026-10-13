import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import pick from 'lodash.pick';

// Keep network concerns in a service module, matching frontend-app-account's
// Redux-era boundary while remaining independent of its sagas and store.
// Keep API writes and state normalization limited to fields owned by this plugin.
export const CUSTOM_ACCOUNT_FIELDS = [
  'ethnicity',
  'employment_status',
  'enrolled_in_school',
  'enrolled_in_school_type',
  'local_community_living',
  'zipcode',
];

// The backend may return lists, message objects, or strings for a field error.
function normalizeCustomFieldErrors(fieldErrors) {
  return Object.entries(fieldErrors).reduce((acc, [fieldName, error]) => {
    if (Array.isArray(error)) {
      acc[fieldName] = error.join(' ');
    } else if (error && typeof error === 'object') {
      acc[fieldName] = error.user_message || error.message || error.detail;
    } else {
      acc[fieldName] = error;
    }
    return acc;
  }, {});
}

// Convert HTTP validation payloads into the fieldErrors contract consumed by the store.
function handleCustomFieldRequestError(error) {
  const responseData = error.response?.data;
  // Support both the field_errors envelope and errors keyed directly by field name.
  const fieldErrors = responseData?.field_errors || CUSTOM_ACCOUNT_FIELDS.reduce((acc, fieldName) => {
    if (responseData?.[fieldName]) {
      acc[fieldName] = responseData[fieldName];
    }
    return acc;
  }, {});

  if (Object.keys(fieldErrors).length > 0) {
    // Attach display errors without mutating the original HTTP error.
    const apiError = Object.create(error);
    apiError.fieldErrors = normalizeCustomFieldErrors(fieldErrors);
    throw apiError;
  }
  // Preserve network and other non-field failures for callers to handle separately.
  throw error;
}

/** Fetch values and metadata for the user identified by the authenticated session. */
export async function getCustomFields() {
  // The /me/ resource derives identity from the authenticated client, so the
  // plugin never accepts or sends a username.
  const requestUrl = `${getConfig().LMS_BASE_URL}/api/custom-reg-form/v1/me/`;
  const { data } = await getAuthenticatedHttpClient()
    .get(requestUrl)
    .catch(handleCustomFieldRequestError);
  return data;
}

/** Persist one supported field, returning server values and any updated metadata. */
export async function patchCustomFields(commitValues) {
  const requestUrl = `${getConfig().LMS_BASE_URL}/api/custom-reg-form/v1/me/`;
  const requestConfig = { headers: { 'Content-Type': 'application/json' } };
  // Filter by key, not truthiness: empty strings, false, and null are valid edits.
  const customFieldValues = pick(commitValues, CUSTOM_ACCOUNT_FIELDS);
  // Each editor saves independently. Enforcing that invariant here also guards
  // future callers that bypass the current field components.
  const editedFields = Object.keys(customFieldValues);
  if (editedFields.length !== 1) {
    throw new Error('patchCustomFields requires exactly one custom field');
  }

  const { data } = await getAuthenticatedHttpClient()
    .patch(requestUrl, customFieldValues, requestConfig)
    .catch(handleCustomFieldRequestError);
  return data;
}
