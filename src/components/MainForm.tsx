import { useRef } from 'react';
import { Formik } from 'formik';
import { sanitizeObject } from 'utils';
import { validationSchema } from './validationSchema';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { FormContents } from './FormContents';
import { config } from 'config';
import type { FormikProps } from 'formik';
import type { Order } from 'types/order';

const { NUM_PAGES, DEPOSIT_COST } = config;

export const MainForm = () => {
  const formikRef = useRef<FormikProps<Order>>(null);
  const { order, updateOrder } = useOrderData();
  const { currentPage, setCurrentPage } = useOrderFlow();

  // this is triggered after People submitted and after PaymentForm submitted
  // for now it's really just validating the PaymentForm page fields (?)
  // note: it doesn't get here until all validations are passing (?)
  function submitForm(values: Order) {
    const submittedOrder = Object.assign({}, values);
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
      onSubmit={values => submitForm(values)}
      innerRef={formikRef}
    >
      <FormContents formikRef={formikRef} />
    </Formik>
  );
};
