import { useOrder } from 'hooks/useOrder';
import { Form } from 'formik';
import { People } from './People';
import { PaymentInfo } from './PaymentInfo';
import { Waitlist } from './Waitlist';
import { config } from 'config';
const { WAITLIST_MODE } = config;

export const FormContents = ({ formikRef }) => {
  const { updateOrder, currentPage, setCurrentPage } = useOrder();

  console.log('FormContents rendered');

  function handleClickBackButton() {
    const { values, setSubmitting } = formikRef.current;
    updateOrder(values);
    setSubmitting(false);
    setCurrentPage(currentPage - 1);
  }

  return(
    <Form spellCheck='false'>
      {currentPage === 1 && <People formikRef={formikRef} />}
      {currentPage === 2 && WAITLIST_MODE && <Waitlist handleClickBackButton={handleClickBackButton} />}
      {currentPage === 2 && !WAITLIST_MODE && <PaymentInfo handleClickBackButton={handleClickBackButton} />}
    </Form>
  );
};
