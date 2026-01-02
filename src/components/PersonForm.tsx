import { useFormikContext } from 'formik';
import { Box, Button } from '@mui/material';
import { getFirstInvalidFieldName, sanitizeObject, getCountry } from 'utils/misc';
import { useOrderData } from 'contexts/OrderDataContext';
import { ContactInfo } from './ContactInfo';
import { MiscInfo } from './MiscInfo';
import { logInfo, logDebug } from 'src/logger';
import { config } from 'config';
import type { Order } from 'types/order';
import type { FormikTouched } from 'formik';
import type { AgeGroup } from 'types/tieredPricing';

export const PersonForm = ({ editIndex, setEditIndex, isNewPerson, setIsNewPerson }: {
  editIndex: number;
  setEditIndex: (index: number | null) => void;
  isNewPerson: boolean;
  setIsNewPerson: (isNew: boolean) => void;
}) => {
  // logDebug('PersonForm rendered');

  const { order, updateOrder } = useOrderData();
  const { values, validateForm, setTouched, setFieldValue, resetForm } = useFormikContext<Order>();

  async function validatePersonForm() {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      logDebug('PersonForm validation failed', errors);
    }
    if (Object.keys(errors).length > 0) {
      logDebug('validatePersonForm errors:', errors);
      setTouched(errors as FormikTouched<Order>, true); // show errors
      // scroll to first invalid field; refactor to use ref instead of directly accessing DOM
      const firstInvalidFieldName = getFirstInvalidFieldName(errors);
      if (firstInvalidFieldName) {
        const invalidFieldElement = document.getElementsByName(firstInvalidFieldName)[0];
        if (invalidFieldElement) {
          invalidFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return false;
    }
    return true;
  }

  function saveUpdatedOrder() {
    // sanitize the order object
    const submittedOrder = Object.assign({}, values);
    const sanitizedOrder = sanitizeObject(submittedOrder);

    // get the person being edited
    const person = sanitizedOrder.people[editIndex];

    // determine country & admission for the person being edited
    const country = getCountry(person);
    const admission = config.admissions.mode === 'tiered'
      ? config.tieredPricing.getDefaultAdmission(person as { age: AgeGroup })
      : person.admission;

    // update formik field value for country & admission
    setFieldValue(`people[${editIndex}].country`, country);
    setFieldValue(`people[${editIndex}].admission`, admission);

    // update order context with country & admission for the person being edited
    updateOrder({
      ...sanitizedOrder,
      people: sanitizedOrder.people.map((person, index) =>
        index === editIndex ? { ...person, country, admission } : person
      )
    });
  }

  // saves updated order, which includes the new or edited person
  async function handleSaveButton() {
    const isValid = await validatePersonForm();
    logDebug('PersonForm handleSaveButton isValid:', isValid);
    if (isValid) {
      if (editIndex === 0) {
        logInfo(`Registration started: ${values.people[0].email}`); // warms up firebase function
      }
      saveUpdatedOrder();
      setEditIndex(null);
      setIsNewPerson(false);
    }
  }

  function handleCancelButton() {
    setEditIndex(null);
    resetForm({ values: order });
    if (isNewPerson) {
      const people = values.people.slice(0, -1);
      setFieldValue('people', people);
      setIsNewPerson(false);
    }
  }

  return (
    <>
      <ContactInfo index={editIndex} />
      <MiscInfo index={editIndex} />
      <Box sx={{ mt: 5, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          { order.people[0].email !== '' ?
            <>
              <div />
              <Button onClick={handleCancelButton} variant='contained' color='warning'>Cancel</Button>
              <div />
              <Button onClick={handleSaveButton} variant='contained' color='success'>Save</Button>
              <div />
            </>
            :
            <>
              <div />
              <Button onClick={handleSaveButton} variant='contained' color='success'>Save</Button>
              <div />
            </>
          }
        </Box>
      </Box>
    </>
  );
};
