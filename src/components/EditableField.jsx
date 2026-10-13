import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Button, Form, StatefulButton,
} from '@openedx/paragon';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SwitchContent from './SwitchContent';
import messages from '../messages';

// Presentation component: the widget supplies state and persistence callbacks.
const EditableField = (props) => {
  const {
    name,
    label,
    emptyLabel,
    type,
    value,
    userSuppliedValue,
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
  const intl = useIntl();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Read the submitted control value rather than a potentially stale render prop.
    onSubmit(name, new FormData(e.target).get(name));
  };

  // Include the field name so the parent can route all editors through shared callbacks.
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleEdit = () => {
    onEdit(name);
  };

  const handleCancel = () => {
    onCancel(name);
  };

  // Empty editable values offer the same entry point as the explicit Edit button.
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
    let finalValue = rawValue;

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
    return (
      <span data-testid="editable-field-confirmation">
        {intl.formatMessage(confirmationMessageDefinition, {
          value: confirmationValue,
        })}
      </span>
    );
  };

  // Pair the visual marker with aria-required on the control; API validation supplies errors.
  const renderRequiredLabel = () => (
    <>
      {label}
      {isRequired && <span aria-hidden="true"> *</span>}
    </>
  );

  // data-hj-suppress keeps account values out of supported session recordings.
  return (
    <SwitchContent
      expression={isEditing ? 'editing' : 'default'}
      cases={{
        editing: (
          <form onSubmit={handleSubmit} data-testid="editable-field-form">
            <Form.Group
              controlId={id}
              isInvalid={error != null}
            >
              <Form.Label size="sm" className="h6 d-block" htmlFor={id}>{renderRequiredLabel()}</Form.Label>
              <Form.Control
                data-testid="editable-field-textbox"
                data-hj-suppress
                name={name}
                id={id}
                type={type}
                value={value}
                onChange={handleChange}
                aria-required={isRequired}
                {...others}
              />
              {!!helpText && <Form.Text>{helpText}</Form.Text>}
              {error != null && <Form.Control.Feedback hasIcon={false} data-testid="editable-field-error">{error}</Form.Control.Feedback>}
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
                data-testid="editable-field-save"
              />
              <Button
                type="button"
                variant="outline-primary"
                onClick={handleCancel}
                data-testid="editable-field-cancel"
                data-clicked="cancel"
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
                <Button variant="link" onClick={handleEdit} className="ml-3" data-testid="editable-field-edit" data-clicked="edit">
                  <FontAwesomeIcon className="mr-1" icon={faPencilAlt} />{intl.formatMessage(messages['account.settings.editable.field.action.edit'])}
                </Button>
              ) : null}
            </div>
            <p data-hj-suppress className={classNames('text-truncate', { 'grayed-out': isGrayedOut })}>{renderValue(value)}</p>
            <p className="small text-muted mt-n2">{renderConfirmationMessage() || helpText}</p>
          </div>
        ),
      }}
    />
  );
};

EditableField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  emptyLabel: PropTypes.node,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  userSuppliedValue: PropTypes.string,
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

export default EditableField;
