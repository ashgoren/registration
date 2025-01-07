import { useRef } from 'react';
import { Formik } from 'formik';
import { sanitizeObject } from 'utils';
import { validationSchema } from './validationSchema';
import { useOrder } from 'hooks/useOrder';
import { FormContents } from './FormContents';
import { config } from 'config';
const { NUM_PAGES, DEPOSIT_COST } = config;

export const MainForm = () => {
  const formikRef = useRef();
  const { order, updateOrder, currentPage, setCurrentPage } = useOrder();

  // this is triggered after People submitted and after PaymentInfo submitted
  // for now it's really just validating the PaymentInfo page fields (?)
  // note: it doesn't get here until all validations are passing (?)
  function submitForm(values, actions) {
    const submittedOrder = Object.assign({}, values);
    const sanitizedOrder = sanitizeObject(submittedOrder);
    updateOrder({
      ...sanitizedOrder,
      deposit: sanitizedOrder.deposit ? sanitizedOrder.people.length * DEPOSIT_COST : 0,
      total: order.total,
      fees: order.fees
    });
    setCurrentPage(currentPage === NUM_PAGES ? 'checkout' : currentPage + 1);
  }

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={ (values, actions) => {submitForm(values, actions);} }
      innerRef={formikRef}
    >
      <FormContents formikRef={formikRef} />
    </Formik>
  );
};
