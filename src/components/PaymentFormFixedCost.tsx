import { Title, Paragraph } from 'components/layouts/SharedStyles';
import { config } from 'config';

export const PaymentFormFixedCost = ({ numPeople }: { numPeople: number }) => {

  return (
    <>
      <Title>Admission cost</Title>
      <Paragraph>
        Number of admissions: {[numPeople]}<br />
        Price per admission: ${config.admissions.fixedCost}
      </Paragraph>
      <Paragraph>
        Admissions total: ${numPeople * config.admissions.fixedCost}
      </Paragraph>
    </>
  );
};
