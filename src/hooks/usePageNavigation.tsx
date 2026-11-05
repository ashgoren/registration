import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { checkPeopleThreshold } from 'src/firebase';
import { logDebug } from 'src/logger';
import { config } from 'config';

const { pages } = config.navigation;

export const usePageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsNavigating, setFurthestPageReached } = useOrderFlow();

  const currentPage = useMemo(() => {
    const pathFinal = location.pathname.split('/').pop() || '';
    return pathFinal === '' ? 'people' : pathFinal;
  }, [location.pathname]);

  const currentIndex = pages.findIndex((page: { key: string }) => page.key === currentPage);

  const goNext = async () => {
    const nextPage = pages[currentIndex + 1];
    if (!nextPage) return;
    
    let nextPageKey: string = pages[currentIndex + 1].key;
    logDebug(`Navigating from ${currentPage} to ${nextPageKey}`);

    // Choose betwen payment and waitlist based on people threshold
    let redirectedToWaitlist = false;
    if (nextPageKey === 'payment') {
      setIsNavigating(true);
      try {
        const { thresholdReached, totalPeople } = await checkPeopleThreshold();
        logDebug(`thresholdReached: ${thresholdReached}, totalPeople: ${totalPeople}`);
        if (thresholdReached) {
          nextPageKey = 'waitlist';
          redirectedToWaitlist = true;
        }
      } catch (error) {
        logDebug('Error checking people threshold', { error });
        // fail open on error: assume threshold not reached
      } finally {
        setIsNavigating(false);
      }
    }

    // Recorded only once the destination is known. When the cutoff redirects to the waitlist, payment was
    // never reached, so it stays out of reach of ProtectedRoute (no typing /payment to get past the cutoff).
    // The waitlist page isn't part of the payment flow's pages, so it isn't recorded either: as the furthest
    // page it would have no index, and ProtectedRoute would bounce every earlier page to it.
    if (!redirectedToWaitlist) setFurthestPageReached(nextPageKey);

    navigate(`/${nextPageKey}`);
  }

  const goBack = () => {
    const prevPage = pages[currentIndex - 1];
    if (!prevPage) return;
    logDebug(`Navigating back from ${currentPage} to ${prevPage.key}`);
    navigate(`/${prevPage.key}`);
  }

  return {
    goNext, goBack,
    currentPage
  };
};
