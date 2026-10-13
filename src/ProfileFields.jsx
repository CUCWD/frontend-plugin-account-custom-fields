import { useIntl } from '@edx/frontend-platform/i18n';

import EditableSelectField from './components/EditableSelectField';
import messages from './messages';
import { useCustomFields } from './store';

// Display order is local; option values and visibility are supplied by the backend.
const PROFILE_FIELDS = [
  'ethnicity',
  'employment_status',
  'enrolled_in_school',
  'enrolled_in_school_type',
  'local_community_living',
];

// All five editors share the same store as the ZIP widget in the other account slot.
const ProfileFields = () => {
  const intl = useIntl();
  // The hook hides the action/reducer/store pipeline from this slot component.
  const {
    formValues, options, visibility, openFormIds, saveStates, errors, open, close, change, save,
  } = useCustomFields();
  // Pass each editor its own value/error and the shared form lifecycle callbacks.
  // Nullish defaults preserve boolean and numeric choices returned by the API.
  // Open and save state are keyed by name so several editors can remain active.
  return (
    <>
      {PROFILE_FIELDS.map(name => (visibility[name] === 'hidden' ? null : (
        <EditableSelectField
          key={name}
          name={name}
          type="select"
          value={formValues[name] ?? ''}
          options={options[name] || []}
          isRequired={visibility[name] === 'required'}
          label={intl.formatMessage(messages[`account.settings.field.${name}`])}
          emptyLabel={intl.formatMessage(messages[`account.settings.field.${name}.empty`])}
          isEditing={openFormIds.includes(name)}
          saveState={saveStates[name]}
          error={errors[name]}
          onEdit={open}
          onCancel={close}
          onChange={change}
          onSubmit={save}
        />
      )))}
    </>
  );
};

export default ProfileFields;
