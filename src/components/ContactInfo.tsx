import { memo } from 'react';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { Title } from 'components/layouts/SharedStyles';
import { ContactInfoInputs } from './ContactInfoInputs';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { RefObject } from 'react';
import type { Order } from 'types/order';
import type { FormikProps } from 'formik';

const { PERSON_INPUT_LABELS, PERSON_CONTACT_FIELDS } = config;

export const ContactInfo = memo(({ index, formikRef }:
  { index: number; formikRef: RefObject<FormikProps<Order>> }
) => {
  logDebug('ContactInfo rendered');

  useScrollToTop();

  return (
    <section className='contact-section'>
      <Title>{PERSON_INPUT_LABELS[index]}</Title>
      <ContactInfoInputs
        index={index}
        fields={PERSON_CONTACT_FIELDS}
        formikRef={formikRef}
      />
    </section>
  );
});
