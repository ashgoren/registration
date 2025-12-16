import { useFormikContext } from 'formik';
import { InputAdornment } from '@mui/material';
import { Paragraph } from 'components/layouts/SharedStyles';
import { Field } from 'components/inputs';
import { clamp } from 'utils/misc';
import { config } from 'config';
import type { FocusEvent } from 'react';
import type { Person } from 'types/order';

export const PaymentFormSlidingScale = ({ people }: { people: Person[] }) => {
  const { setFieldValue, handleBlur } = useFormikContext();
  const isMultiplePeople = people.length > 1;

  function updateAdmissionValue(event: FocusEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFieldValue(name, clampAdmission(Number(value)));
    handleBlur(event); // bubble up to formik
  }

  return (
    <>
      <Paragraph>Please read the sliding scale explanation above.</Paragraph>

      {isMultiplePeople && <Paragraph>How much is each person able to pay?</Paragraph>}
      {people.map((person, index) =>
        <Field
          alignRight
          key={index}
          sx={{ width: '5em', mb: 1 }}
          label={isMultiplePeople ? `${person.first} ${person.last}` : 'How much are you able to pay?'}
          name={`people[${index}].admission`}
          type='pattern'
          pattern='###'
          range={config.admissions.costRange}
          onBlur={updateAdmissionValue}
          InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
        />
      )}
    </>
  );
};

const clampAdmission = (value: number) => clamp(value || config.admissions.costRange[0], config.admissions.costRange);
