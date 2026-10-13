import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Button, Form, StatefulButton,
} from '@openedx/paragon';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SwitchContent from './SwitchContent';
import messages from '../messages';

// Presentation component: the widget supplies state and persistence callbacks.
const EditableSelectField = (props) => {
  const intl = useIntl();
  const {
    name,
    label,
    emptyLabel,
    type,
    value,
    userSuppliedValue,
    options = [],
    saveState,
    error,
    confirmationMessageDefinition,
    confirmationValue,
    helpText,
    onEdit,
    onCancel,
    onSubmit,
    onChange,
    isEditing = false,
    isEditable = true,
    isGrayedOut = false,
    isRequired = false,
    ...others
  } = props;
  const id = `field-${name}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Read the submitted control value rather than a potentially stale render prop.
    onSubmit(name, new FormData(e.target).get(name));
  };

  // Native select events deliver strings even when the API supplied typed choice values.
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleEdit = () => {
    onEdit(name);
  };

  const handleCancel = () => {
    onCancel(name);
  };

  const renderEmptyLabel = () => {
    if (isEditable) {
      return <Button variant="link" onClick={handleEdit} className="p-0">{emptyLabel}</Button>;
    }
    return <span className="text-muted">{emptyLabel}</span>;
  };

  // Zero and false are saved values, not an indication that the field is empty.
  const renderValue = (rawValue) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return renderEmptyLabel();
    }
    // Keep the stored value visible if it no longer matches a top-level choice.
    let finalValue = rawValue;

    if (options) {
      // Native select controls stringify values, while API choices may be numbers or booleans.
      const selectedOption = options.find(option => String(option.value) === String(rawValue));
      if (selectedOption) {
        finalValue = selectedOption.label;
      }
    }

    if (userSuppliedValue) {
      finalValue += `: ${userSuppliedValue}`;
    }

    return finalValue;
  };

  // Returning null lets the display view fall back to helpText when no confirmation applies.
  const renderConfirmationMessage = () => {
    if (!confirmationMessageDefinition || confirmationValue == null) {
      return null;
    }
    return intl.formatMessage(confirmationMessageDefinition, {
      value: confirmationValue,
    });
  };

  // Pair the visual marker with aria-required on the control; API validation supplies errors.
  const renderRequiredLabel = () => (
    <>
      {label}
      {isRequired && <span aria-hidden="true"> *</span>}
    </>
  );

  // Preserve backend ordering and disabled choices, including choices inside groups.
  const selectOptions = options.map((option) => {
    if (option.group) {
      // If the option has a 'group' property, it represents an element with sub-options.
      return (
        <optgroup label={option.label} key={option.label}>
          {option.group.map((subOption) => (
            <option
              value={subOption.value}
              key={`${subOption.value}-${subOption.label}`}
              disabled={subOption?.disabled}
            >
              {subOption.label}
            </option>
          ))}
        </optgroup>
      );
    }
    return (
      <option value={option.value} key={`${option.value}-${option.label}`} disabled={option?.disabled}>
        {option.label}
      </option>
    );
  });

  // data-hj-suppress keeps account values out of supported session recordings.
  // The controlled select stringifies API boolean choices to match DOM option values.
  return (
    <SwitchContent
      expression={isEditing ? 'editing' : 'default'}
      cases={{
        editing: (
          <form onSubmit={handleSubmit}>
            <Form.Group
              controlId={id}
              isInvalid={error != null}
            >
              <Form.Label size="sm" className="h6 d-block" htmlFor={id}>{renderRequiredLabel()}</Form.Label>
              <Form.Control
                data-hj-suppress
                name={name}
                id={id}
                type={type}
                as={type}
                value={typeof value === 'boolean' ? String(value) : value}
                onChange={handleChange}
                aria-required={isRequired}
                {...others}
              >
                {options.length > 0 && selectOptions}
              </Form.Control>
              {!!helpText && <Form.Text>{helpText}</Form.Text>}
              {error != null && <Form.Control.Feedback>{error}</Form.Control.Feedback>}
              {others.children}
            </Form.Group>
            <p>
              <StatefulButton
                type="submit"
                className="mr-2"
                state={saveState}
                labels={{
                  default: intl.formatMessage(messages['account.settings.editable.field.action.save']),
                }}
                onClick={(e) => {
                  // Block repeat clicks while saving, keeping the button focusable
                  // so SwitchContent can transfer focus when the editor closes.
                  if (saveState === 'pending') { e.preventDefault(); }
                }}
                disabledStates={[]}
              />
              <Button
                type="button"
                variant="outline-primary"
                onClick={handleCancel}
              >
                {intl.formatMessage(messages['account.settings.editable.field.action.cancel'])}
              </Button>
            </p>
          </form>
        ),
        default: (
          <div className="form-group">
            <div className="d-flex align-items-start">
              <h6 aria-level="3">{renderRequiredLabel()}</h6>
              {isEditable ? (
                <Button variant="link" onClick={handleEdit} className="ml-3">
                  <FontAwesomeIcon className="mr-1" icon={faPencilAlt} />{intl.formatMessage(messages['account.settings.editable.field.action.edit'])}
                </Button>
              ) : null}
            </div>
            <p data-hj-suppress className={isGrayedOut ? 'grayed-out' : null}>{renderValue(value)}</p>
            <p className="small text-muted mt-n2">{renderConfirmationMessage() || helpText}</p>
          </div>
        ),
      }}
    />
  );
};

EditableSelectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  emptyLabel: PropTypes.node,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  userSuppliedValue: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  })),
  saveState: PropTypes.oneOf(['default', 'pending', 'complete', 'error']),
  error: PropTypes.string,
  confirmationMessageDefinition: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    description: PropTypes.string,
  }),
  confirmationValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  helpText: PropTypes.node,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  isEditable: PropTypes.bool,
  isGrayedOut: PropTypes.bool,
  isRequired: PropTypes.bool,
};

export default EditableSelectField;
