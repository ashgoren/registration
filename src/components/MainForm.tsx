import { useRef, useState } from 'react';
import { Formik } from 'formik';
import { checkPeopleThreshold } from 'src/firebase';
import { sanitizeObject } from 'utils';
import { validationSchema } from './validationSchema';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { FormContents } from './FormContents';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { FormikProps } from 'formik';
import type { Order } from 'types/order';

const { NUM_PAGES, DEPOSIT_COST } = config;

export const MainForm = () => {
  const formikRef = useRef<FormikProps<Order>>(null);
  const { order, updateOrder } = useOrderData();
  const { currentPage, setCurrentPage, setWaitlistThresholdReached } = useOrderFlow();
  const [isCheckingThreshold, setIsCheckingThreshold] = useState(false);

  async function handlePeopleSubmit(values: Order) {
    // Check threshold before advancing to PaymentForm
    setIsCheckingThreshold(true);
    try {
      const response = await checkPeopleThreshold();
      const { thresholdReached, totalPeople } = response;
      logDebug(`thresholdReached: ${thresholdReached}, totalPeople: ${totalPeople}`);
      setWaitlistThresholdReached(thresholdReached);
    } catch (error) {
      logDebug('Error checking people threshold', { error });
    } finally {
      // fail open on error: assume threshold not reached
      setIsCheckingThreshold(false);
    }

    // Then normal submit (advance to next page)
    submitForm(values);
  }

  // Submit handler triggered after People submitted & after PaymentForm submitted,
  // but only after validation passes.
  function submitForm(values: Order) {
    const submittedOrder = Object.assign({}, values);
    logDebug('People or PaymentForm submitted:', values);
    const sanitizedOrder = sanitizeObject(submittedOrder);
    updateOrder({
      ...sanitizedOrder,
      deposit: sanitizedOrder.deposit ? sanitizedOrder.people.length * DEPOSIT_COST : 0,
      total: order.total,
      fees: order.fees,
    });
    setCurrentPage(currentPage === NUM_PAGES ? 'checkout' : (currentPage as number) + 1);
  }

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={currentPage === 1 ? handlePeopleSubmit : submitForm}
      innerRef={formikRef}
    >
      <FormContents formikRef={formikRef} isCheckingThreshold={isCheckingThreshold} />
    </Formik>
  );
};
