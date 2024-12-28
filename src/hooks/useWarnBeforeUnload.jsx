import { useEffect } from 'react';

export const useWarnBeforeUnload = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    if (window.location.hostname === 'localhost') return;

    const warnBeforeUserLeavesSite = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
    return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
  }, [enabled]);
};
