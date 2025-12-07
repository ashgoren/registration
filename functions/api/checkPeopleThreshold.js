import { logger } from 'firebase-functions/v2';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { peopleCounterDoc } from '../shared/orders.js';

const WAITLIST_CUTOFF = 240;

export const checkPeopleThreshold = async () => {
  logger.info('checkPeopleThreshold called');
  try {
    const peopleCounterSnapshot = await peopleCounterDoc.get();
    const peopleCounterData = peopleCounterSnapshot.data() || {};
    const totalPeople = peopleCounterData.count || 0;

    logger.info(`Total people count: ${totalPeople}`);
    const thresholdReached = totalPeople >= WAITLIST_CUTOFF;

    return { thresholdReached, totalPeople };
  } catch (err) {
    throw createError(ErrorType.DATABASE_READ, 'Error checking people count', { error: err });
  }
};
