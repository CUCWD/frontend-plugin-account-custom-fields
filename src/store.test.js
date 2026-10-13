import React from 'react';
import { act, renderHook } from '@testing-library/react';

// Exercise the real shared store while controlling request completion and failures.
jest.mock('./service', () => ({
  CUSTOM_ACCOUNT_FIELDS: ['ethnicity', 'employment_status', 'enrolled_in_school', 'enrolled_in_school_type', 'local_community_living', 'zipcode'],
  getCustomFields: jest.fn(),
  patchCustomFields: jest.fn(),
}));

let store;
let service;
beforeEach(() => {
  // Isolate module-level state between tests while keeping the renderer
  // and hook on the same React instance.
  jest.resetModules();
  jest.doMock('react', () => React);
  store = jest.requireActual('./store');
  service = jest.requireMock('./service');
});
afterEach(() => jest.useRealTimers());

it('loads once for both hook consumers and exposes editing helpers', async () => {
  service.getCustomFields.mockResolvedValue({ values: { zipcode: '00123', ethnicity: 'a' } });
  const first = renderHook(() => store.useCustomFields());
  // Separate consumers represent the ZIP and profile widgets mounted in different slots.
  const second = renderHook(() => store.useCustomFields());
  await act(async () => {});
  expect(service.getCustomFields).toHaveBeenCalledTimes(1);
  act(() => {
    first.result.current.open('zipcode');
    first.result.current.change('zipcode', '');
    first.result.current.change('enrolled_in_school', false);
    first.result.current.open('ethnicity');
    first.result.current.change('ethnicity', undefined);
    first.result.current.change('local_community_living', null);
  });
  expect(first.result.current.formValues).toEqual({
    zipcode: '', ethnicity: undefined, enrolled_in_school: false, local_community_living: null,
  });
  expect(second.result.current.formValues).toEqual(first.result.current.formValues);
  expect(first.result.current.openFormIds).toEqual(['zipcode', 'ethnicity']);
  act(() => first.result.current.close('ethnicity'));
  expect(first.result.current.openFormIds).toEqual(['zipcode']);
  expect(first.result.current.drafts).toEqual({
    zipcode: '', enrolled_in_school: false, local_community_living: null,
  });
  expect(first.result.current.formValues.ethnicity).toBe('a');
  act(() => first.result.current.close('zipcode'));
  expect(first.result.current.openFormIds).toEqual([]);
  first.unmount();
  second.unmount();
});

it('deduplicates async fetches and permits retry after failure', async () => {
  service.getCustomFields.mockRejectedValueOnce(new Error('offline'));
  await store.handleFetchCustomFields();
  let finish;
  // Keep the retry pending long enough to prove another load cannot start a duplicate GET.
  service.getCustomFields.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = store.handleFetchCustomFields();
  await store.handleFetchCustomFields();
  expect(service.getCustomFields).toHaveBeenCalledTimes(2);
  finish({ values: { zipcode: '00123' } });
  await pending;
  await store.handleFetchCustomFields();
  expect(service.getCustomFields).toHaveBeenCalledTimes(2);
});

it('resolves saves before the delayed close and preserves response metadata', async () => {
  // Advance the completion display delay explicitly instead of waiting on wall-clock time.
  jest.useFakeTimers();
  service.getCustomFields.mockResolvedValue({ values: {} });
  const hook = renderHook(() => store.useCustomFields());
  await act(async () => {});
  service.patchCustomFields.mockResolvedValue({ values: { zipcode: '00123' }, metadata: { visibility: { zipcode: 'required' } } });
  await act(async () => {
    hook.result.current.open('zipcode');
    hook.result.current.change('zipcode', '00123');
    hook.result.current.change('ethnicity', 'b');
    await hook.result.current.save('zipcode', '00123');
  });
  expect(service.patchCustomFields).toHaveBeenCalledWith({ zipcode: '00123' });
  expect(hook.result.current.saveStates.zipcode).toBe('complete');
  expect(hook.result.current.visibility.zipcode).toBe('required');
  expect(hook.result.current.drafts).toEqual({ ethnicity: 'b' });
  expect(hook.result.current.formValues.zipcode).toBe('00123');
  expect(hook.result.current.openFormIds).toEqual(['zipcode']);
  act(() => jest.advanceTimersByTime(1000));
  expect(hook.result.current.openFormIds).toEqual([]);
  await act(async () => {
    hook.result.current.open('zipcode');
    await hook.result.current.save('zipcode', '00123');
  });
  act(() => hook.result.current.open('ethnicity'));
  act(() => jest.advanceTimersByTime(1000));
  expect(hook.result.current.openFormIds).toEqual(['ethnicity']);
});

it('handles validation and unexpected save failures without rejecting', async () => {
  service.getCustomFields.mockResolvedValue({ values: {} });
  const hook = renderHook(() => store.useCustomFields());
  await act(async () => {});
  service.patchCustomFields.mockRejectedValueOnce({ fieldErrors: { zipcode: 'Invalid' } });
  await act(async () => hook.result.current.save('zipcode', 'bad'));
  expect(hook.result.current).toMatchObject({ saveStates: { zipcode: 'error' }, errors: { zipcode: 'Invalid' } });
  service.patchCustomFields.mockRejectedValueOnce(new Error('offline'));
  await act(async () => {
    await expect(store.handleSaveCustomField('zipcode', '00123')).resolves.toBeUndefined();
  });
  expect(hook.result.current).toMatchObject({ saveStates: { zipcode: 'error' }, errors: {} });
});
