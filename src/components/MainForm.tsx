import { useRef, useState } from 'react';
import { Formik, Form } from 'formik';
import { checkPeopleThreshold } from 'src/firebase';
import { sanitizeObject } from 'utils/misc';
import { validationSchema } from './validationSchema';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { People } from './People';
import { PaymentForm } from './PaymentForm';
import { Waitlist } from './Waitlist';
import { WaiverWrapper } from './Waiver';
import { NavButtons } from 'components/layouts';
import { getPreviousPage, getNextPage } from 'utils/pageFlow';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { FormikProps } from 'formik';
import type { Order } from 'types/order';

const { DEPOSIT_COST, WAITLIST_MODE, SHOW_WAIVER } = config;

export const MainForm = () => {
  const formikRef = useRef<FormikProps<Order>>(null);
  const { order, updateOrder } = useOrderData();
  const { currentPage, setCurrentPage, waitlistThresholdReached, setWaitlistThresholdReached, showNavButtons } = useOrderFlow();
  const [isCheckingThreshold, setIsCheckingThreshold] = useState(false);
  const [disableNext, setDisableNext] = useState(false);

  function handleClickBackButton() {
    if (!formikRef?.current) return;
    const { values, setSubmitting } = formikRef.current;
    updateOrder(values);
    setSubmitting(false);
    setCurrentPage(getPreviousPage(currentPage));
  }

  async function checkThreshold(values: Order) {
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
    setCurrentPage(getNextPage(currentPage));
  }

  const waitlistMode = WAITLIST_MODE || waitlistThresholdReached;

  const backProps = {
    text: 'Back',
    onClick: handleClickBackButton
  };

  const nextProps = {
    text: currentPage === 'payment' ? 'Checkout' : 'Next',
    onClick: () => formikRef.current?.submitForm(),
    disableNext: disableNext
  };

  const checkThresholdNextProps = {
    text: isCheckingThreshold ? 'Thinking...' : 'Next',
    disable: isCheckingThreshold || disableNext,
    onClick: () => formikRef.current?.submitForm()
  }

  const getNavButtonProps = () => {
    if (currentPage === 'people') { // People
      return {
        next: SHOW_WAIVER ? nextProps : checkThresholdNextProps
      };
    } else if (currentPage === 'waiver') { // Waiver
      return {
        back: backProps,
        next: SHOW_WAIVER ? checkThresholdNextProps : nextProps
      };
    } else if (currentPage === 'payment' && waitlistMode) { // Waitlist
      return {
        back: backProps,
      };
    } else if (currentPage === 'payment' && !waitlistMode) { // PaymentForm
      return {
        back: backProps,
        next: nextProps
      }
    }
  };

  const submitHandlerMap = {
    people: SHOW_WAIVER ? submitForm : checkThreshold,
    waiver: SHOW_WAIVER ? checkThreshold : submitForm,
    payment: submitForm
  };

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={submitHandlerMap[currentPage as keyof typeof submitHandlerMap]}
      innerRef={formikRef}
    >
      <>
        <Form spellCheck='false'>
          {currentPage === 'people' && <People formikRef={formikRef} />}
          {currentPage === 'waiver' && <WaiverWrapper setDisableNext={setDisableNext} />}
          {currentPage === 'payment' && waitlistMode && <Waitlist />}
          {currentPage === 'payment' && !waitlistMode && <PaymentForm />}
        </Form>

        {showNavButtons && <NavButtons {...getNavButtonProps()} />}
      </>

    </Formik>
  );
};
