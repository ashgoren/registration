import { useFormikContext } from 'formik';
import { InputAdornment } from '@mui/material';
import { Paragraph } from 'components/layouts/SharedStyles';
import { Field } from 'components/inputs';
import { clamp } from 'utils';
import { config } from 'config';
const { ADMISSION_COST_RANGE } = config;

export const PaymentFormSlidingScale = ({ people }) => {
  const { setFieldValue, handleBlur } = useFormikContext();
  const isMultiplePeople = people.length > 1;

  function updateAdmissionValue(event) {
    const { name, value } = event.target;
    setFieldValue(name, clampAdmission(value));
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
          range={ADMISSION_COST_RANGE}
          onBlur={updateAdmissionValue}
          InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
        />
      )}
    </>
  );
};

const clampAdmission = (value) => clamp(value || ADMISSION_COST_RANGE[0], ADMISSION_COST_RANGE);
