import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import ZipCodeField from './ZipCodeField';
import ProfileFields from './ProfileFields';
import { useCustomFields } from './store';

// Store behavior is covered separately; these tests exercise real controls and callback wiring.
jest.mock('./store', () => ({ useCustomFields: jest.fn() }));

let state;
// Supply translations through the same context the host provides to mounted widgets.
const renderWidget = widget => render(<IntlProvider locale="en">{widget}</IntlProvider>);
beforeEach(() => {
  state = {
    formValues: { zipcode: '00123', ethnicity: 'asian' },
    options: { ethnicity: [{ value: 'asian', label: 'Asian' }, { value: 'other', label: 'Other' }] },
    visibility: {},
    openFormIds: [],
    saveStates: {},
    errors: {},
    open: jest.fn(),
    close: jest.fn(),
    change: jest.fn(),
    save: jest.fn(),
  };
  useCustomFields.mockImplementation(() => state);
});

it('renders ZIP with its saved leading zeros and opens the editor', () => {
  renderWidget(<ZipCodeField />);
  expect(screen.getByText('ZIP Code')).toBeInTheDocument();
  expect(screen.getByText('00123')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /edit/i }));
  expect(state.open).toHaveBeenCalledWith('zipcode');
});

it('hides ZIP when metadata marks it hidden', () => {
  state.visibility.zipcode = 'hidden';
  const { container } = renderWidget(<ZipCodeField />);
  expect(container).toBeEmptyDOMElement();
});

it('marks ZIP required and passes edits, saves, cancel, and API errors through', () => {
  state.visibility.zipcode = 'required';
  state.openFormIds = ['zipcode'];
  state.errors.zipcode = 'Invalid ZIP code';
  const { rerender } = renderWidget(<ZipCodeField />);
  const input = screen.getByTestId('editable-field-textbox');
  expect(input).toHaveAttribute('aria-required', 'true');
  expect(screen.getByText('Invalid ZIP code')).toBeInTheDocument();
  fireEvent.change(input, { target: { value: '00456' } });
  expect(state.change).toHaveBeenCalledWith('zipcode', '00456');
  // The mocked store does not reduce change events; emulate its next render explicitly.
  state.formValues.zipcode = '00456';
  rerender(<IntlProvider locale="en"><ZipCodeField /></IntlProvider>);
  fireEvent.submit(screen.getByTestId('editable-field-form'));
  expect(state.save).toHaveBeenCalledWith('zipcode', '00456');
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(state.close).toHaveBeenCalledWith('zipcode');
});

it('renders all five profile labels and backend option labels', () => {
  renderWidget(<ProfileFields />);
  ['Ethnicity', 'Employment status', 'Enrolled in school', 'School type', 'Local community living', 'Asian'].forEach(label => {
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

it('keeps editors in separate plugin slots visually open together', () => {
  state.openFormIds = ['zipcode', 'ethnicity'];
  renderWidget(
    <>
      <ZipCodeField />
      <ProfileFields />
    </>,
  );
  expect(screen.getByRole('textbox', { name: /zip code/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /ethnicity/i })).toBeInTheDocument();
});

it('hides every profile field marked hidden', () => {
  state.visibility = Object.fromEntries([
    'ethnicity', 'employment_status', 'enrolled_in_school', 'enrolled_in_school_type', 'local_community_living',
  ].map(name => [name, 'hidden']));
  const { container } = renderWidget(<ProfileFields />);
  expect(container).toBeEmptyDOMElement();
});

it('uses backend select options, required state, error, change, save and cancel', () => {
  state.openFormIds = ['ethnicity'];
  state.visibility.ethnicity = 'required';
  state.errors.ethnicity = 'Choose a valid ethnicity';
  const { rerender } = renderWidget(<ProfileFields />);
  const select = screen.getByRole('combobox', { name: /ethnicity/i });
  expect(select).toHaveAttribute('aria-required', 'true');
  expect(select).toHaveValue('asian');
  expect(screen.getByText('Choose a valid ethnicity')).toBeInTheDocument();
  fireEvent.change(select, { target: { value: 'other' } });
  expect(state.change).toHaveBeenCalledWith('ethnicity', 'other');
  // Reflect the selected draft back into the controlled widget before submitting it.
  state.formValues.ethnicity = 'other';
  rerender(<IntlProvider locale="en"><ProfileFields /></IntlProvider>);
  fireEvent.submit(select.closest('form'));
  expect(state.save).toHaveBeenCalledWith('ethnicity', 'other');
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(state.close).toHaveBeenCalledWith('ethnicity');
});

it('displays falsy saved select values using backend option labels', () => {
  state.formValues.enrolled_in_school = false;
  state.options.enrolled_in_school = [{ value: false, label: 'Not enrolled' }];
  renderWidget(<ProfileFields />);
  expect(screen.getByText('Not enrolled')).toBeInTheDocument();
});
