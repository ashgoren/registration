import { useEffect } from 'react';

export const useWarnBeforeUnload = () => {
  useEffect(() => {
    if (window.location.hostname === 'localhost') return;

    const warnBeforeUserLeavesSite = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
    return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
  }, []);
};
