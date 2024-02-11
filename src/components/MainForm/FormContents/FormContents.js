import { useState } from 'react';
import { Form, useFormikContext } from 'formik';
import { clamp, cache, getFirstInvalidFieldName } from 'utils';
import People from '../People';
import PaymentInfo from '../PaymentInfo';
import ButtonRow from 'components/ButtonRow';
import { Hidden } from '@mui/material';
import { MyMobileStepper } from 'components/MyStepper';
import config from 'config';
const { NUM_PAGES } = config;

export default function FormContents({ admissionQuantity, setAdmissionQuantity, currentPage, setCurrentPage, order, setOrder }) {
  const formik = useFormikContext();
  const { values } = formik;
  const [donate, setDonate] = useState(values.donation > 0);

  async function saveForm() {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched(errors, true); // show errors
      // scroll to first invalid field; refactor to use ref instead of directly accessing DOM
      const firstInvalidFieldName = getFirstInvalidFieldName(formik.errors);
      if (firstInvalidFieldName) {
        const invalidFieldElement = document.getElementsByName(firstInvalidFieldName)[0];
        if (invalidFieldElement) {
          invalidFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    const updatedOrder = Object.assign({}, values);
    setOrder({ ...updatedOrder, admissionQuantity });
    return true;
  }

  async function resetForm() {
    formik.resetForm({ values: order });
  }

  function clampValue({ event, range }) {
    const [field, value] = [event.target.name, parseInt(event.target.value) || range[0]];
    const clampedValue = clamp(value, range);
    formik.setFieldValue(field, clampedValue);
    formik.handleBlur(event); // bubble up to formik
  };

  function handleClickBackButton() {
    const orderInProgress = Object.assign({}, values);
    cache('order', orderInProgress);
    formik.setSubmitting(false);
    setCurrentPage(currentPage - 1);
  }

  return(
    <Form spellCheck='false'>
      {currentPage === 1 &&
        <People
          admissionQuantity={admissionQuantity} setAdmissionQuantity={setAdmissionQuantity}
          order={order}
          resetForm={resetForm}
          saveForm={saveForm}
        />
      }
      {currentPage === 2 &&
        <PaymentInfo
          donate={donate} setDonate={setDonate}
          clampValue={clampValue}
          admissionQuantity={admissionQuantity}
        />
      }
      <Hidden smDown>
        {currentPage > 1 &&
          <ButtonRow
            backButtonProps = {{ onClick: handleClickBackButton }}
            nextButtonProps = {{ type: 'submit', text: currentPage === NUM_PAGES ? 'Checkout...' : 'Next...'}}
          />
        }
      </Hidden>
      <Hidden smUp>
        <MyMobileStepper currentPage={currentPage} onClickBack={handleClickBackButton} />
      </Hidden>
    </Form>
  );
}
