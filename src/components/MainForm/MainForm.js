import { useEffect } from 'react';
import { useOrder } from 'components/OrderContext';
import { Formik } from 'formik';
import { sanitizeObject, warnBeforeUserLeavesSite } from 'utils';
import FormContents from "./FormContents";
import { validationSchema } from './validationSchema';
import config from 'config';
const { NUM_PAGES, DEPOSIT_COST } = config;

export default function MainForm() {
  const { order, updateOrder, currentPage, setCurrentPage } = useOrder();

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
      return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
    }
  }, []);

  // this is for the final form submit (after last page before checkout)
  // for now it's really just validating the PaymentInfo page fields
  // note: it doesn't get here until all validations are passing
  function submitForm(values, actions) {
    const submittedOrder = Object.assign({}, values);
    const sanitizedOrder = sanitizeObject(submittedOrder);
    const updatedOrder = {
      ...sanitizedOrder,
      deposit: sanitizedOrder.deposit ? sanitizedOrder.people.length * DEPOSIT_COST : 0
    };
    if (currentPage === NUM_PAGES) {
      updateOrder({ ...updatedOrder, status: 'checkout' });
    } else {
      updateOrder(updatedOrder);
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage })}
      validateOnBlur={true}
      validateOnChange={false}
      onSubmit={ (values, actions) => {submitForm(values, actions);} }
    >
      <FormContents />
    </Formik>
  );
}
