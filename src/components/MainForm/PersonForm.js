import { useOrder } from 'hooks/useOrder';
import { Box, Button } from '@mui/material';
import ContactInfo from './ContactInfo';
import MiscInfo from './MiscInfo';
import { getFirstInvalidFieldName, sanitizeObject } from 'utils';
import countryMapping from 'countryMapping';
import { firebaseFunctionDispatcher } from 'firebase.js';

export default function PersonForm({ editIndex, setEditIndex, isNewPerson, setIsNewPerson, resetForm, formikRef }) {
  console.log('PersonForm rendered');

  const { order, updateOrder, warmedUp, setWarmedUp } = useOrder();

  async function validatePersonForm() {
    const { validateForm, setTouched } = formikRef.current;
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setTouched(errors, true); // show errors
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
    const { values } = formikRef.current;
    const submittedOrder = Object.assign({}, values);
    const sanitizedOrder = sanitizeObject(submittedOrder);
    const orderWithCountry = {
      ...sanitizedOrder,
      people: sanitizedOrder.people.map(updateCountry)
    };
    updateOrder(orderWithCountry);
  }

  // saves updated order, which includes the new or edited person
  async function handleSaveButton() {
    const isValid = await validatePersonForm();
    if (isValid) {
      if (!warmedUp) {
        console.log('warming up firebase functions');
        firebaseFunctionDispatcher({ action: 'caffeinate' });
        setWarmedUp(true);
      }
      saveUpdatedOrder();
      setEditIndex(null);
      setIsNewPerson(false);
    }
  }

  function handleCancelButton() {
    const { values, setFieldValue } = formikRef.current;
    setEditIndex(null);
    resetForm();
    if (isNewPerson) {
      const people = values.people.slice(0, -1);
      setFieldValue('people', people);
      setIsNewPerson(false);
    }
  }

  return (
    <>
      <ContactInfo index={editIndex} formikRef={formikRef} />
      <MiscInfo index={editIndex} formikRef={formikRef} />
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
}

function updateCountry(person) {
  if (person.country === 'United States') {
    return { ...person, country: 'USA' };
  } else if (person.state) {
    const region = person.state.toLowerCase().replace(/\s/g, '').trim();
    const country = countryMapping[region] || person.country;
    return { ...person, country };
  } else {
    return person;
  }
}
