import { Title, Paragraph } from 'components/layouts/SharedStyles';
import { config } from 'config';
const { ADMISSION_COST_FIXED } = config;

export const PaymentFormFixedCost = ({ numPeople }) => {

  return (
    <>
      <Title>Admission cost</Title>
      <Paragraph>
        Number of admissions: {[numPeople]}<br />
        Price per admission: ${ADMISSION_COST_FIXED}
      </Paragraph>
      <Paragraph>
        Admissions total: ${numPeople * ADMISSION_COST_FIXED}
      </Paragraph>
    </>
  );
};
