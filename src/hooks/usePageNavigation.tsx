import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { checkPeopleThreshold } from 'src/firebase';
import { logDebug } from 'src/logger';
import { config } from 'config';

const { PAGES } = config;

export const usePageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsNavigating, setFurthestPageReached } = useOrderFlow();

  const currentPage = useMemo(() => {
    const pathFinal = location.pathname.split('/').pop() || '';
    return pathFinal === 'registration' || pathFinal === '' ? 'people' : pathFinal;
  }, [location.pathname]);

  const currentIndex = PAGES.findIndex((page: { key: string }) => page.key === currentPage);

  const goNext = async () => {
    const nextPage = PAGES[currentIndex + 1];
    if (!nextPage) return;
    
    let nextPageKey = PAGES[currentIndex + 1].key;
    setFurthestPageReached(nextPageKey);
    logDebug(`Navigating from ${currentPage} to ${nextPageKey}`);
    
    // Choose betwen payment and waitlist based on people threshold
    if (nextPageKey === 'payment') {
      setIsNavigating(true);
      try {
        const { thresholdReached, totalPeople } = await checkPeopleThreshold();
        logDebug(`thresholdReached: ${thresholdReached}, totalPeople: ${totalPeople}`);
        if (thresholdReached) {
          nextPageKey = 'waitlist';
        }
      } catch (error) {
        logDebug('Error checking people threshold', { error });
        // fail open on error: assume threshold not reached
      } finally {
        setIsNavigating(false);
      }
    }

    navigate(`/registration/${nextPageKey}`);
  }

  const goBack = () => {
    const prevPage = PAGES[currentIndex - 1];
    if (!prevPage) return;
    logDebug(`Navigating back from ${currentPage} to ${prevPage.key}`);
    navigate(`/registration/${prevPage.key}`);
  }

  return {
    goNext, goBack,
    currentPage
  };
};
