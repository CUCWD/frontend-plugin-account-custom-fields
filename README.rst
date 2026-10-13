frontend-plugin-account-custom-fields
#####################################

|license-badge| |status-badge|

``frontend-plugin-account-custom-fields`` adds ZIP code, ethnicity,
employment, school enrollment, and local-community fields to the Open edX
Account MFE. Tutor registers the package's ``ZipCodeField`` and
``ProfileFields`` exports in the appropriate account plugin slots.

The widgets load field values, choice lists, and visibility metadata from
``/api/custom-reg-form/v1/me/``. They also save each field independently and
display validation errors returned by that API.

Architecture
************

The state-management layout intentionally resembles the Redux architecture in
``frontend-app-account``. Keeping familiar action, reducer, service, and view
boundaries makes code moved out of that MFE easier to compare and maintain.
This package does **not** install Redux or connect to the Account MFE's Redux
store.

The plugin owns a small external store built with React's
``useSyncExternalStore``:

.. code-block:: text

   slot widget
       |
       v
   useCustomFields (store.js)
       |
       v
   async handler (sagas.js) ---> service request
       |
       v
   action creator ---> reducer ---> subscribed widgets

The files have the following responsibilities:

- ``src/actions.js`` defines action-type constants and creates plain action
  objects. The ``FETCH_CUSTOM_FIELDS`` and ``SAVE_CUSTOM_FIELD`` phase names
  mirror the Account MFE, but they do not depend on Redux.
- ``src/reducers.js`` contains the pure reducer, initial state, and response
  normalization. It never performs requests, schedules timers, or notifies
  React.
- ``src/store.js`` owns the current state and subscriber set. It dispatches
  actions directly to the reducer, binds the asynchronous handlers to the
  local store, and exposes the ``useCustomFields`` hook.
- ``src/sagas.js`` coordinates asynchronous service calls and delayed actions.
  Its name matches the previous Account MFE structure to make transitions
  easier, but it uses ordinary async functions rather than Redux Saga,
  generator effects, or middleware.
- ``src/service.js`` is the HTTP boundary. It fetches and patches the custom
  registration API and translates API validation responses into field errors.
- ``src/ZipCodeField.jsx`` and ``src/ProfileFields.jsx`` are the public slot
  widgets. Both subscribe to the same module-level store, so editors in either
  slot can remain open together and their initial request is shared.
- ``src/components/`` contains the reusable editable controls and transition
  behavior used by the widgets.
- ``src/messages.js`` contains translatable control and field labels.

Why the plugin has its own store
================================

The Account MFE's Redux store is an internal implementation detail rather than
a plugin API. Depending on it would tightly couple this package to the host's
reducers, middleware, and provider configuration. A local external store
allows widgets mounted in separate slots to share state while keeping the
package self-contained.

Actions and reducers are useful patterns outside Redux. Here, action objects
describe state changes and the reducer applies them synchronously. The local
``dispatch`` function then notifies ``useSyncExternalStore`` subscribers. No
Redux store, React Redux provider, Redux Saga middleware, or thunk is involved.

Editing behavior
================

Saved values and drafts are stored separately. When a field has a draft, that
draft overrides its saved value. Opening another field preserves each unsaved
draft and leaves the existing editor open. Clicking Cancel closes only that
editor and discards only that field's draft. A successful save updates the
stored value, clears only the saved field's draft, and briefly displays that
field's completed state before closing its editor.

Only one custom field is sent per PATCH request. Empty strings, ``false``, and
``null`` are retained because they can represent intentional edits.

API metadata
============

The API may return field values directly or inside a ``values`` object. Choice
lists and visibility rules are read from the ``metadata`` object:

.. code-block:: json

   {
     "values": {
       "zipcode": "00123"
     },
     "metadata": {
       "options": {
         "ethnicity": [
           {"value": "asian", "label": "Asian"}
         ]
       },
       "visibility": {
         "zipcode": "required",
         "ethnicity": "optional"
       }
     }
   }

Supported visibility values are ``required``, ``optional``, and ``hidden``.
Missing or unknown values default to ``optional``. When a PATCH response omits
metadata, the store retains the metadata loaded previously.

Development
***********

Install dependencies and run the standard checks with:

.. code-block:: bash

   npm ci
   npm run lint
   npm test
   npm run build

``npm run build`` compiles the public package into ``dist/``. Tests are split
by responsibility: service behavior, reducer transitions, store coordination,
and rendered custom-field widgets.

Publishing to npmjs
*******************

Initial manual publication
==========================

Publish the first version interactively before configuring GitHub Actions
Trusted Publishing. Your npm account must have permission to create packages
in the ``cucwd`` npm organization, which is separate from the GitHub organization.
Confirm that ``package.json`` names the package
``@cucwd/frontend-plugin-account-custom-fields`` and contains the intended
unpublished version (``1.0.0`` for the initial release).

Enable two-factor authentication in your npm account settings before the first
publish. Run the following commands from this repository's root, proceeding
only when each command succeeds. Confirm that ``npm whoami`` reports the account
with publishing access to ``cucwd``. Complete the browser login and the additional
publishing authentication prompts when requested:

.. code-block:: bash

   npm login --auth-type=web --registry=https://registry.npmjs.org/
   npm whoami --registry=https://registry.npmjs.org/
   npm ci
   npm run lint
   npm test -- --runInBand
   npm pack --dry-run
   npm publish --access public --registry=https://registry.npmjs.org/

The packaging dry run invokes ``prepack`` to clean and build ``dist/``. Review
its file listing for ``dist/index.js``, widget implementations, and required
styles before publishing. The final command creates the public organization
package on npmjs. This manual step does not require an npm automation token
stored in GitHub Actions.

Verify the initial release:

.. code-block:: bash

   npm view @cucwd/frontend-plugin-account-custom-fields@1.0.0 version --registry=https://registry.npmjs.org/

Before the next automated release, ensure the Git tag ``v1.0.0`` points to the
exact committed source that was manually published and is available on the
remote repository. Check existing tags before creating one; do not move an
existing release tag. This lets semantic-release recognize the published
version instead of attempting to publish it again. Published npm versions
cannot be overwritten.

Configure Trusted Publishing
============================

After the package exists, open its settings on npmjs.com and add a
``GitHub Actions`` trusted publisher with these values:

- Organization or user: ``CUCWD``.
- Repository: ``frontend-plugin-account-custom-fields``.
- Workflow filename: ``release.yml`` (not the full path).
- Environment name: leave blank; the release job does not declare an environment.
- Allow direct ``npm publish`` for the semantic-release workflow.

See the `npm Trusted Publishing documentation
<https://docs.npmjs.com/trusted-publishers/>`_ for the package-side configuration.

Once trust is configured and the initial release tag is available remotely,
subsequent pushes to ``develop/ulmo.master`` run the release workflow. It installs
npm 11.12.1, installs dependencies, runs lint and tests, and validates packaging
before semantic-release determines whether a new version is needed.

The workflow uses ``id-token: write`` for npm OIDC authentication and the
automatic ``GITHUB_TOKEN`` for GitHub releases and comments. It does not require
``SEMANTIC_RELEASE_NPM_TOKEN`` or a custom GitHub personal access token.
Trusted Publishing must be configured on npmjs; the workflow file alone does
not establish that trust.

License
*******

The code in this repository is licensed under the AGPLv3. See ``LICENSE`` for
details.

.. |license-badge| image:: https://img.shields.io/github/license/CUCWD/frontend-plugin-account-custom-fields.svg
   :target: https://github.com/CUCWD/frontend-plugin-account-custom-fields/blob/main/LICENSE
   :alt: License

.. |status-badge| image:: https://img.shields.io/badge/Status-Maintained-brightgreen
   :alt: Status: Maintained
