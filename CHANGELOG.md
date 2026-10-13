# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-10-13

**Build**

- Enable the semantic-release workflow on pushes to `develop/ulmo.master`.
- Configure GitHub and npm authentication through the `SEMANTIC_RELEASE_GITHUB_TOKEN` and `SEMANTIC_RELEASE_NPM_TOKEN` Actions secrets.

**Features**

- Add `ZipCodeField` and `ProfileFields` widgets for the Account MFE plugin slots.
- Support ZIP code, ethnicity, employment, school enrollment, school type, and local-community fields.
- Load and save custom fields through the authenticated `/api/custom-reg-form/v1/me/` endpoint.
- Use backend-provided choice lists and `required`, `optional`, and `hidden` visibility metadata.
- Normalize API validation responses into field-level errors.
- Share loading and editing state between separate slot widgets through a local store based on React's `useSyncExternalStore`.
- Allow multiple custom-field editors to remain open with independent save states and errors.
- Organize state changes with Redux-inspired action creators and a pure reducer without adding a Redux dependency.

**Bug Fixes**

- Preserve leading-zero ZIP codes and explicit empty, `false`, and `null` field values.
- Preserve unsaved drafts when switching editors and discard only the affected field's draft on Cancel or Save.
- Deduplicate simultaneous custom-field loads while allowing failed requests to be retried.
- Retain existing values and metadata when a PATCH response contains only the saved field.
- Prevent a delayed save completion from closing a different field opened in the meantime.

**Miscellaneous Tasks**

- Normalize the npm package scope to lowercase `@cucwd` for registry compatibility.
- Move the custom-field API client into `service.js` to match the naming used by `frontend-app-account`.
- Extract pure state transitions from `store.js` into `reducers.js`.
- Extract action types and creators into `actions.js`, using `FETCH_CUSTOM_FIELDS` and `SAVE_CUSTOM_FIELD` lifecycle phases.
- Name the store's asynchronous orchestrators `handleFetchCustomFields` and `handleSaveCustomField` to match the handlers previously implemented as sagas.
- Move asynchronous orchestration into `sagas.js` to match the previous Account MFE structure while continuing to use ordinary async functions instead of Redux Saga.
- Rename the combined widget test to `customFields.test.jsx` to describe its coverage.
- Restore `lodash.pick` for filtering PATCH payloads to supported custom-field keys.
- Add service, reducer, store, and rendered-widget test coverage.
- Replace the inherited template README with plugin-specific architecture, state-flow, API metadata, editing, and development documentation.
- Document how the plugin preserves the Account MFE's familiar Redux-style boundaries while remaining independent of Redux.
- Expand inline documentation for action payloads, reducer invariants, injected async handlers, shared subscriptions, form privacy, and focus behavior.
- Replace deprecated function-component `defaultProps` with parameter defaults and make Cancel buttons explicitly non-submitting.
