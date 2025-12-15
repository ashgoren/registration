import { Box } from '@mui/material';
import { Header } from 'components/layouts';
import { StyledPaper, StyledLink, Paragraph, SectionDivider } from 'components/layouts/SharedStyles';
import { mailtoLink, websiteLink } from 'utils/misc';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { config } from 'config';

export const Confirmation = () => {
  const { receipt } = useOrderData();
  const { paymentMethod } = useOrderPayment();

  if (!receipt) throw new Error('No receipt found in order data context');

  return (
    <>
      {!config.registrationOnly &&
        <Header
          titleText = { paymentMethod === 'check'
            ? `${config.event.title} Registration`
            : `${config.event.title} Confirmation`
          }
        />
      }

      <StyledPaper>
        <Paragraph>
          Thank you for registering to join us at {config.event.title}!
          You will be emailed your registration information for your records.
          You can find information about camp at <StyledLink to={websiteLink(config.links.info)}>{config.links.info}</StyledLink> and we will email you in the weeks before camp.
          If you have any questions, please contact us at <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>.
        </Paragraph>

        <SectionDivider />

        <div dangerouslySetInnerHTML={{ __html: receipt }} />

        <Box my={2} />
      </StyledPaper>
    </>
  );
};
