import { useEffect } from 'react';
import { Formik } from 'formik';
import { sanitizeObject, warnBeforeUserLeavesSite } from 'utils';
import FormContents from "./FormContents";
import { validationSchema } from './validationSchema';
import countryMapping from 'countryMapping';
import config from 'config';
const { NUM_PAGES } = config;

export default function MainForm({ order, setOrder, currentPage, setCurrentPage }) {

  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      window.addEventListener('beforeunload', warnBeforeUserLeavesSite);
      return () => window.removeEventListener('beforeunload', warnBeforeUserLeavesSite);
    }
  }, []);

  // it doesn't get here until all validations are passing
  function submitForm(values, actions) {
    console.log('submitForm function');
    const submittedOrder = Object.assign({}, values);
    const sanitizedOrder = sanitizeObject(submittedOrder);
    const orderWithCountry = { ...sanitizedOrder, people: sanitizedOrder.people.map(updateCountry) };
    setOrder(orderWithCountry);
    setCurrentPage(currentPage === NUM_PAGES ? 'checkout' : currentPage + 1);
  }

  return (
    <Formik
      initialValues={order}
      validationSchema={validationSchema({ currentPage })}
      onSubmit={ (values, actions) => {submitForm(values, actions);} }
    >
      <FormContents
        currentPage={currentPage} setCurrentPage={setCurrentPage}
        order={order} setOrder={setOrder}
      />
    </Formik>
  );
}

function updateCountry(person) {
  if (person.state) {
    const region = person.state.toLowerCase().replace(/\s/g, '').trim();
    const country = countryMapping[region] || person.country;
    return { ...person, country };
  } else {
    return person;
  }
}
