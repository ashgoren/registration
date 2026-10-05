import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { sendMail } from './email.js';
import { getConfig } from '../config/internal/config.js';

const MAX_RECEIPTS_PER_HOUR = 300;

// One counter doc per hour
const getHourlyCounterDoc = () => {
  const hour = new Date().toISOString().slice(0, 13);
  return getFirestore().collection('metadata').doc(`receiptCount-${hour}`);
};

// Returns whether a receipt may be sent, counting it if so. The transaction locks the counter doc, so
// concurrent function instances can't both read the same count and overshoot the limit.
export const reserveReceiptSend = async () => {
  const counterDoc = getHourlyCounterDoc();

  let result: { allowed: boolean; shouldAlert: boolean };
  try {
    result = await getFirestore().runTransaction(async (transaction) => {
      const data = (await transaction.get(counterDoc)).data() ?? {};
      const count: number = data.count ?? 0;
      if (count < MAX_RECEIPTS_PER_HOUR) {
        transaction.set(counterDoc, { count: count + 1 }, { merge: true });
        return { allowed: true, shouldAlert: false };
      }
      // the alerted flag means only the first blocked send per hour notifies admins
      if (!data.alerted) {
        transaction.set(counterDoc, { alerted: true }, { merge: true });
        return { allowed: false, shouldAlert: true };
      }
      return { allowed: false, shouldAlert: false };
    });
  } catch (err) {
    logger.error('Receipt throttle check failed, sending anyway', err);
    return true;
  }

  if (result.shouldAlert) await sendLimitAlert();
  return result.allowed;
};

const sendLimitAlert = async () => {
  const { EMAIL_NOTIFY_TO, PROJECT_ID } = getConfig();
  try {
    await sendMail({
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID}: Receipt emails paused (hourly limit reached)`,
      text: `More than ${MAX_RECEIPTS_PER_HOUR} receipt emails were requested this hour, so further receipts are ` +
        `being skipped until the next hour. This may indicate abuse of the registration API.\n\n` +
        `Orders are still being saved normally. Search the function logs for "HOURLY LIMIT REACHED" to find ` +
        `skipped recipients if any need their receipts resent.`
    });
  } catch (err) {
    logger.error('Failed to send receipt limit alert', err);
  }
};
