import { Box, Button } from '@mui/material';
import { useOrder } from 'components/OrderContext';
import { StyledPaper, StyledLink, Paragraph, SectionDivider } from 'components/Layout/SharedStyles';
import Receipt from 'components/Receipt';
import { mailtoLink, websiteLink } from 'utils';
import config from 'config';
const { EMAIL_CONTACT, EVENT_TITLE, MORE_INFO_URL } = config;

export default function Confirmation() {
  const { order, startOver, paymentMethod } = useOrder();

  return (
    <>
      <StyledPaper>

        <Paragraph>
          Thank you for registering to join us at {EVENT_TITLE}!
          You will be emailed your registration information for your records.
          You can find information about camp at <StyledLink to={websiteLink(MORE_INFO_URL)}>{MORE_INFO_URL}</StyledLink> and we will email you in the weeks before camp.
          If you have any questions, please contact us at <StyledLink to={mailtoLink(EMAIL_CONTACT)}>{EMAIL_CONTACT}</StyledLink>.
        </Paragraph>

        <SectionDivider />

        <Receipt order={order} paymentMethod={paymentMethod} isPurchaser={true} />

      </StyledPaper>

      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <div />
          <Button variant='outlined' color='warning' onClick={startOver}>
            Start another registration
          </Button>
          <div />
        </Box>
      </StyledPaper>
    </>
  );
}
