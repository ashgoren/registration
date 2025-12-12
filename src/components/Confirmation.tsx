import { Box } from '@mui/material';
import { Header } from 'components/layouts';
import { StyledPaper, StyledLink, Paragraph, SectionDivider } from 'components/layouts/SharedStyles';
import { mailtoLink, websiteLink } from 'utils/misc';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { config } from 'config';
const { EMAIL_CONTACT, EVENT_TITLE, MORE_INFO_URL, REGISTRATION_ONLY, CONFIRMATION_ELECTRONIC_TITLE, CONFIRMATION_CHECK_TITLE } = config;

export const Confirmation = () => {
  const { receipt } = useOrderData();
  const { paymentMethod } = useOrderPayment();

  if (!receipt) throw new Error('No receipt found in order data context');

  return (
    <>
      {!REGISTRATION_ONLY &&
        <Header
          titleText={paymentMethod === 'check' ? CONFIRMATION_CHECK_TITLE : CONFIRMATION_ELECTRONIC_TITLE}
        />
      }

      <StyledPaper>
        <Paragraph>
          Thank you for registering to join us at {EVENT_TITLE}!
          You will be emailed your registration information for your records.
          You can find information about camp at <StyledLink to={websiteLink(MORE_INFO_URL)}>{MORE_INFO_URL}</StyledLink> and we will email you in the weeks before camp.
          If you have any questions, please contact us at <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.
        </Paragraph>

        <SectionDivider />

        <div dangerouslySetInnerHTML={{ __html: receipt }} />

        <Box my={2} />
      </StyledPaper>
    </>
  );
};
