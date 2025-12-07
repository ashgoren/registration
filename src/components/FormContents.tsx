import { Form } from 'formik';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { People } from './People';
import { PaymentForm } from './PaymentForm';
import { Waitlist } from './Waitlist';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { RefObject } from 'react';
import type { FormikProps } from 'formik';
import type { Order } from 'types/order';

const { WAITLIST_MODE } = config;

export const FormContents = ({ formikRef, isCheckingThreshold }: {
  formikRef: RefObject<FormikProps<Order> | null>, isCheckingThreshold: boolean }
) => {
  const { updateOrder } = useOrderData();
  const { currentPage, setCurrentPage, waitlistThresholdReached } = useOrderFlow();

  logDebug('FormContents rendered');

  function handleClickBackButton() {
    if (!formikRef?.current) return;
    const { values, setSubmitting } = formikRef.current;
    updateOrder(values);
    setSubmitting(false);
    if (typeof currentPage !== 'number') {
      throw new Error(`currentPage is not a number: ${currentPage}`);
    }
    setCurrentPage(currentPage - 1);
  }

  const waitlistMode = WAITLIST_MODE || waitlistThresholdReached;

  return(
    <Form spellCheck='false'>
      {currentPage === 1 && <People formikRef={formikRef} isCheckingThreshold={isCheckingThreshold} />}
      {currentPage === 2 && waitlistMode && <Waitlist handleClickBackButton={handleClickBackButton} />}
      {currentPage === 2 && !waitlistMode && <PaymentForm handleClickBackButton={handleClickBackButton} />}
    </Form>
  );
};
