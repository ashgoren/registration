// NOTE: listTransactions requires manually enabling that access in PayPal developer dashboard

import { logger } from 'firebase-functions/v2';
import { getDateChunks } from '../shared/helpers.js';
import { createError, ErrorType } from '../shared/errorHandler.js';
import { getPayPalAccessToken, getPaypalApiUrl } from './auth.js';
import type { NormalizedPaymentTransaction } from '../scheduled/matchPayments.js';

/* * * * * * * * * * PayPal Transactions List * * * * * * * * * * * * * * * * * * * * * * * *
 * PayPal SDK does not support listing transactions directly.                               *
 * We need to manually fetch transactions using the REST API.                               *
 * The code below retrieves all transactions for a given description within the past year.  *
 * This requires enabling the "Transactions" permission in the PayPal developer dashboard.  *
 * Note that there is also a signficant delay (up to 24 hours) for transactions to appear.  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// List transactions from PayPal API (only available in REST API, not SDK)
export const listPaypalTransactions = async (description: string): Promise<NormalizedPaymentTransaction[]> => {
  logger.info('listPaypalTransactions', { description });

  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    throw createError(ErrorType.PAYPAL_API, 'Failed to retrieve PayPal access token');
  }

  const transactions = await fetchAllTransactions(accessToken);

  const matchingTransactions = transactions.filter(txn => 
    txn.transaction_info?.transaction_subject === description
  );
  logger.info(`Found ${matchingTransactions.length} transactions for: ${description}`);

  const normalizedTransactions = matchingTransactions.map(normalizeTransaction);

  logger.debug('Normalized PayPal transactions from API:', normalizedTransactions); // debug log
  return normalizedTransactions;
};

const fetchAllTransactions = async (accessToken: string) => {
  // Fetch in 30-day chunks due to PayPal API limitations
  const dateChunks = createDateChunks();
  const transactions = [];

  for (const { start, end } of dateChunks) {
    const chunkTransactions = await fetchTransactionChunk(accessToken, start, end);
    transactions.push(...chunkTransactions);
  }

  if (!transactions.length) {
    logger.info('No PayPal transactions found (recent transactions may not yet appear)');
  }

  return transactions;
};

const fetchTransactionChunk = async (accessToken: string, startDate: Date, endDate: Date) => {
  const params = new URLSearchParams({
    'start_date': startDate.toISOString(),
    'end_date': endDate.toISOString(),
    'fields': 'all',
    'page_size': '500'
  });

  let response;
  const paypalApiUrl = getPaypalApiUrl();

  try {
    response = await fetch(`${paypalApiUrl}/v1/reporting/transactions?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
  } catch (err) {
    throw createError(ErrorType.PAYPAL_API, `Error fetching PayPal transactions. Does the REST API app have "transaction search" enabled? Is the API URL correct? ${(err as Error).message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw createError(ErrorType.PAYPAL_API, `Failed to fetch transactions with start_date ${startDate.toISOString()} and end_date ${endDate.toISOString()}: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (data?.total_items === 0) return [];
  if (!data?.transaction_details || !Array.isArray(data.transaction_details)) {
    throw createError(ErrorType.PAYPAL_API, 'Invalid response format from PayPal transactions API');
  }

  return data.transaction_details;
};

const createDateChunks = () => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1);
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  return getDateChunks(startDate, endDate, 30);
};

export interface PaypalTransaction {
  transaction_info: {
    transaction_id: string;
    transaction_amount: {
      value: string;
      currency_code: string;
    };
    transaction_initiation_date: string;
    transaction_subject: string;
  };
  payer_info: {
    email_address: string;
  };
}

const normalizeTransaction = (txn: PaypalTransaction): {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  email: string;
} => {
  const { transaction_info, payer_info } = txn;
  const { transaction_id, transaction_amount, transaction_initiation_date } = transaction_info;
  const { email_address } = payer_info;

  return {
    id: transaction_id,
    amount: parseFloat(transaction_amount.value),
    currency: transaction_amount.currency_code,
    date: new Date(transaction_initiation_date),
    email: email_address
  };
};

// // Helper for debug logging of retrieved transactions
// const logTransactions = (transactions: PaypalTransaction[]) => {
//   for (const txn of transactions) {
//     const { id, amount, currency, subject, date, email } = txn;
//     logger.debug(`Transaction ID: ${id}, Amount: ${amount} ${currency}, Subject: ${subject}, Date: ${date.toISOString()}, Email: ${email}`);
//   }
// }
