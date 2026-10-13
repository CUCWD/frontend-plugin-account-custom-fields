import React from 'react';
import PropTypes from 'prop-types';
import { TransitionReplace } from '@openedx/paragon';

const onChildExit = (htmlNode) => {
  // Move focus only when it would otherwise be lost with the departing view.
  if (htmlNode.contains(document.activeElement)) {
    // TransitionReplace keeps both views mounted during the animation;
    // accept the replacement on either side of the departing node.
    const enteringChild = htmlNode.previousSibling || htmlNode.nextSibling;

    // No replacement means there is no new view to receive focus.
    if (!enteringChild) {
      return;
    }

    // The first matching control becomes the keyboard entry point for the new view.
    const focusableElements = enteringChild.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length) {
      focusableElements[0].focus();
    }
  }
};

// Animate between display/edit views while preserving keyboard focus on transitions.
// cases may contain React elements or string aliases, matching the account MFE helper.
const SwitchContent = ({ expression = null, cases, className = null }) => {
  const getContent = (caseKey) => {
    if (cases[caseKey]) {
      // A string case aliases another case; element keys identify transition children.
      if (typeof cases[caseKey] === 'string') {
        return getContent(cases[caseKey]);
      }
      return React.cloneElement(cases[caseKey], { key: caseKey });
    }
    // Unknown expressions can fall back to a default element or a named case alias.
    if (cases.default) {
      if (typeof cases.default === 'string') {
        return getContent(cases.default);
      }
      return React.cloneElement(cases.default, { key: 'default' });
    }

    return null;
  };

  return (
    <TransitionReplace
      className={className}
      onChildExit={onChildExit}
    >
      {getContent(expression)}
    </TransitionReplace>
  );
};

SwitchContent.propTypes = {
  expression: PropTypes.string,
  cases: PropTypes.objectOf(PropTypes.node).isRequired,
  className: PropTypes.string,
};

export default SwitchContent;
