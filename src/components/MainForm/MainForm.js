import { useRef } from 'react';
import { useOrder } from 'components/OrderContext';
import { Formik } from 'formik';
import { sanitizeObject } from 'utils';
import FormContents from "./FormContents";
import { validationSchema } from './validationSchema';
import config from 'config';
import useWarnBeforeUnload from 'hooks/useWarnBeforeUnload';
const { NUM_PAGES, DEPOSIT_COST } = config;

export default function MainForm() {
  const formikRef = useRef();
  const { order, updateOrder, currentPage, setCurrentPage } = useOrder();

  useWarnBeforeUnload();

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
}
