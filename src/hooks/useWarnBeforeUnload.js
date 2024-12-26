import { useEffect } from 'react';

export default function useWarnBeforeUnload() {
  useEffect(() => {
    if (window.location.hostname === 'localhost') return;

    const warnBeforeUserLeavesSite = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
    return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
  }, []);
}
