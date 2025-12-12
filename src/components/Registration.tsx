import { useState } from 'react';
import { People } from 'components/People';
import { PreRegistration } from 'components/Static/PreRegistration';
import { TestModeWarning } from 'components/Static/TestModeWarning';
import { config } from 'config';
const { PRD_LIVE, ENV, SHOW_PRE_REGISTRATION } = config;

export const RegistrationWrapper = () => {
  const [registering, setRegistering] = useState(false);
  if (registering) {
    return <People />;
  } else if (ENV === 'stg' || (ENV === 'prd' && !PRD_LIVE)) {
    return <TestModeWarning setRegistering={setRegistering} />;
  } else if (SHOW_PRE_REGISTRATION) {
    return <PreRegistration setRegistering={setRegistering} />;
  } else {
    return <People />;
  }
};
