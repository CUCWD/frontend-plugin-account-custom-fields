import { defineMessages } from '@edx/frontend-platform/i18n';

// Static message IDs support extraction and preserve the account MFE translation keys.
// Choice labels are supplied by the API; these messages cover controls and field labels.
// Field keys and their .empty companions match the names used by the slot widgets.
export default defineMessages({
  'account.settings.editable.field.action.edit': {
    id: 'account.settings.editable.field.action.edit',
    defaultMessage: 'Edit',
    description: 'The edit button on an editable field',
  },
  'account.settings.editable.field.action.save': {
    id: 'account.settings.editable.field.action.save',
    defaultMessage: 'Save',
    description: 'The save button on an editable field',
  },
  'account.settings.editable.field.action.cancel': {
    id: 'account.settings.editable.field.action.cancel',
    defaultMessage: 'Cancel',
    description: 'The cancel button on an editable field',
  },
  'account.settings.field.zipcode': {
    id: 'account.settings.field.zipcode',
    defaultMessage: 'ZIP Code',
    description: 'Label for the zipcode account field.',
  },
  'account.settings.field.zipcode.empty': {
    id: 'account.settings.field.zipcode.empty',
    defaultMessage: 'Add ZIP code',
    description: 'Empty prompt for the zipcode account field.',
  },
  'account.settings.field.ethnicity': {
    id: 'account.settings.field.ethnicity',
    defaultMessage: 'Ethnicity',
    description: 'Label for the ethnicity account field.',
  },
  'account.settings.field.ethnicity.empty': {
    id: 'account.settings.field.ethnicity.empty',
    defaultMessage: 'Add ethnicity',
    description: 'Empty prompt for the ethnicity account field.',
  },
  'account.settings.field.employment_status': {
    id: 'account.settings.field.employment_status',
    defaultMessage: 'Employment status',
    description: 'Label for the employment_status account field.',
  },
  'account.settings.field.employment_status.empty': {
    id: 'account.settings.field.employment_status.empty',
    defaultMessage: 'Add employment status',
    description: 'Empty prompt for the employment_status account field.',
  },
  'account.settings.field.enrolled_in_school': {
    id: 'account.settings.field.enrolled_in_school',
    defaultMessage: 'Enrolled in school',
    description: 'Label for the enrolled_in_school account field.',
  },
  'account.settings.field.enrolled_in_school.empty': {
    id: 'account.settings.field.enrolled_in_school.empty',
    defaultMessage: 'Add school enrollment status',
    description: 'Empty prompt for the enrolled_in_school account field.',
  },
  'account.settings.field.enrolled_in_school_type': {
    id: 'account.settings.field.enrolled_in_school_type',
    defaultMessage: 'School type',
    description: 'Label for the enrolled_in_school_type account field.',
  },
  'account.settings.field.enrolled_in_school_type.empty': {
    id: 'account.settings.field.enrolled_in_school_type.empty',
    defaultMessage: 'Add school type',
    description: 'Empty prompt for the enrolled_in_school_type account field.',
  },
  'account.settings.field.local_community_living': {
    id: 'account.settings.field.local_community_living',
    defaultMessage: 'Local community living',
    description: 'Label for the local_community_living account field.',
  },
  'account.settings.field.local_community_living.empty': {
    id: 'account.settings.field.local_community_living.empty',
    defaultMessage: 'Add local community living',
    description: 'Empty prompt for the local_community_living account field.',
  },
});
