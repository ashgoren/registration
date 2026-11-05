import { Box } from '@mui/material';
import { Header } from 'components/layouts';
import { StyledPaper, StyledLink, Paragraph, SectionDivider } from 'components/layouts/SharedStyles';
import { mailtoLink, websiteLink } from 'utils/misc';
import { useOrderData } from 'contexts/OrderDataContext';
import { useOrderPayment } from 'contexts/OrderPaymentContext';
import { config } from 'config';

export const Confirmation = () => {
  const { receipt, order } = useOrderData();
  const { paymentMethod } = useOrderPayment();

  // The order is already saved by the time this page renders, so a missing receipt (e.g. cleared session
  // storage) only means there's nothing to display here. A plain message avoids showing the router's
  // generic error screen for an order that actually went through.
  if (!receipt) {
    return (
      <StyledPaper>
        <Paragraph>
          We're sorry, but we could not find your receipt text.
          Please contact {config.contacts.tech} for assistance if you believe this is an error.
        </Paragraph>
      </StyledPaper>
    );
  }

  // Waitlist sign-ups end here too, unpaid. Read from paymentId rather than paymentMethod, which stays at
  // its payment default when the waitlist cutoff sends someone to the waitlist outside waitlist mode.
  const isWaitlist = order.paymentId === 'waitlist';

  return (
    <>
      {!config.standalone &&
        <Header
          titleText = {
            isWaitlist ? `${config.event.title} Waitlist`
            : paymentMethod === 'check' ? `${config.event.title} Registration`
            : `${config.event.title} Confirmation`
          }
        />
      }

      <StyledPaper>
        {isWaitlist ? (
          <Paragraph>
            We will notify you if a spot becomes available.
            You will be emailed a copy of this waitlist sign-up for your records.
            You can find information about camp at <StyledLink to={websiteLink(config.links.info)}>{config.links.info}</StyledLink>.
            If you have any questions, please contact us at <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>.
          </Paragraph>
        ) : (
          <Paragraph>
            Thank you for registering to join us at {config.event.title}!
            You will be emailed your registration information for your records.
            You can find information about camp at <StyledLink to={websiteLink(config.links.info)}>{config.links.info}</StyledLink> and we will email you in the weeks before camp.
            If you have any questions, please contact us at <StyledLink to={mailtoLink(config.contacts.info)}>{config.contacts.info}</StyledLink>.
          </Paragraph>
        )}

        <SectionDivider />

        <div dangerouslySetInnerHTML={{ __html: receipt }} />

        <Box my={2} />
      </StyledPaper>
    </>
  );
};
