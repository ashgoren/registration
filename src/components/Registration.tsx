import { useState } from 'react';
import { People } from 'components/People';
import { PreRegistration } from 'components/Static/PreRegistration';
import { TestModeWarning } from 'components/Static/TestModeWarning';
import { config } from 'config';

export const RegistrationWrapper = () => {
  const [registering, setRegistering] = useState(false);
  if (registering) {
    return <People />;
  } else if (config.env === 'stg' || (config.env === 'prd' && !config.productionMode)) {
    return <TestModeWarning setRegistering={setRegistering} />;
  } else if (config.registration.showPreregistration) {
    return <PreRegistration setRegistering={setRegistering} />;
  } else {
    return <People />;
  }
};
