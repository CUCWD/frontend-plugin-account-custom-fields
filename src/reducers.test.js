import { defaultState, reducer } from './reducers';
import {
  fetchCustomFieldsBegin,
  fetchCustomFieldsFailure,
  fetchCustomFieldsSuccess,
  closeCustomForm,
  openCustomForm,
  saveCustomFieldSuccess,
  updateCustomDraft,
} from './actions';

// Exercise pure state transitions independently of store subscriptions and requests.
it('normalizes visibility and reads metadata only from its backend envelope', () => {
  const state = reducer(undefined, fetchCustomFieldsSuccess({
    zipcode: '00123',
    visibility: { zipcode: 'hidden' },
    options: { zipcode: ['ignored'] },
    metadata: { visibility: { zipcode: 'required', ethnicity: 'invalid' }, options: { ethnicity: ['a'] } },
  }));
  expect(state).not.toHaveProperty('customFields');
  expect(state.values).toEqual({ zipcode: '00123' });
  expect(state.visibility.zipcode).toBe('required');
  expect(state.visibility.ethnicity).toBe('optional');
  expect(state.options).toEqual({ ethnicity: ['a'] });
  const legacy = reducer(undefined, fetchCustomFieldsSuccess({
    visibility_metadata: { zipcode: 'hidden' },
    field_options: { zipcode: ['ignored'] },
  }));
  expect(legacy.visibility.zipcode).toBe('optional');
  expect(legacy.options).toEqual({});
});

it('handles fetch begin, failure, retry and duplicate loads', () => {
  const loading = reducer(undefined, fetchCustomFieldsBegin());
  expect(loading.loading).toBe(true);
  expect(reducer(loading, fetchCustomFieldsBegin())).toBe(loading);
  const failed = reducer(loading, fetchCustomFieldsFailure('offline'));
  expect(failed).toMatchObject({ loading: false, loaded: false, loadingError: 'offline' });
  expect(reducer(failed, fetchCustomFieldsBegin()).loadingError).toBeNull();
});

it('preserves values and metadata on partial saves, and accepts new save metadata', () => {
  const existing = {
    ...defaultState,
    values: { zipcode: '00123', ethnicity: 'a' },
    drafts: { zipcode: '', ethnicity: 'b' },
    saveStates: { ethnicity: 'pending' },
    errors: { ethnicity: 'Still saving' },
    options: { ethnicity: ['a'] },
    visibility: { ...defaultState.visibility, zipcode: 'required' },
  };
  const saved = reducer(existing, saveCustomFieldSuccess('zipcode', {
    values: { zipcode: '' }, options: {}, visibility: {},
  }));
  expect(saved.values).toEqual({ zipcode: '', ethnicity: 'a' });
  expect(saved.drafts).toEqual({ ethnicity: 'b' });
  expect(saved.saveStates).toEqual({ ethnicity: 'pending', zipcode: 'complete' });
  expect(saved.errors).toEqual({ ethnicity: 'Still saving' });
  expect(saved.options).toBe(existing.options);
  expect(saved.visibility.zipcode).toBe('required');
  const updated = reducer(saved, saveCustomFieldSuccess('enrolled_in_school', {
    enrolled_in_school: false,
    metadata: { options: {}, visibility: { zipcode: 'hidden' } },
  }));
  expect(updated.values.enrolled_in_school).toBe(false);
  expect(updated.values).not.toHaveProperty('metadata');
  expect(updated.options).toEqual({});
  expect(updated.visibility.zipcode).toBe('hidden');
});

it('keeps drafts while switching fields and discards only the canceled field', () => {
  let state = reducer(undefined, openCustomForm('zipcode'));
  state = reducer(state, updateCustomDraft('zipcode', '90210'));
  state = reducer(state, openCustomForm('ethnicity'));
  state = reducer(state, updateCustomDraft('ethnicity', 'a'));
  expect(state.openFormIds).toEqual(['zipcode', 'ethnicity']);
  expect(state.drafts).toEqual({ zipcode: '90210', ethnicity: 'a' });

  state = reducer(state, closeCustomForm('ethnicity'));
  expect(state.openFormIds).toEqual(['zipcode']);
  expect(state.drafts).toEqual({ zipcode: '90210' });
});
