import { useIntl } from '@edx/frontend-platform/i18n';

import EditableField from './components/EditableField';
import messages from './messages';
import { useCustomFields } from './store';

// Rendered inside the host account-information slot; the host owns the slot wrapper.
const ZipCodeField = () => {
  const intl = useIntl();
  // The hook hides the action/reducer/store pipeline from this slot component.
  const {
    formValues, visibility, openFormIds, saveStates, errors, open, close, change, save,
  } = useCustomFields();
  // Subscribe before checking visibility so metadata changes can reveal this field.
  if (visibility.zipcode === 'hidden') {
    return null;
  }
  // Keep ZIP codes as text to preserve leading zeros and nonnumeric postal codes.
  // An absent value becomes an empty string so the input stays controlled during loading.
  return (
    <EditableField
      name="zipcode"
      type="text"
      value={formValues.zipcode ?? ''}
      isRequired={visibility.zipcode === 'required'}
      label={intl.formatMessage(messages['account.settings.field.zipcode'])}
      emptyLabel={intl.formatMessage(messages['account.settings.field.zipcode.empty'])}
      isEditing={openFormIds.includes('zipcode')}
      saveState={saveStates.zipcode}
      error={errors.zipcode}
      onEdit={open}
      onCancel={close}
      onChange={change}
      onSubmit={save}
    />
  );
};

export default ZipCodeField;
