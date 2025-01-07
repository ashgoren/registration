import { Box } from '@mui/material';
import { useOrder } from 'hooks/useOrder';
import { StyledPaper, StyledLink, Paragraph, SectionDivider } from 'components/layouts/SharedStyles';
import { mailtoLink, websiteLink } from 'utils';
import { config } from 'config';
const { EMAIL_CONTACT, EVENT_TITLE, MORE_INFO_URL } = config;

export const Confirmation = () => {
  const { receipt } = useOrder();

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

        <div dangerouslySetInnerHTML={{ __html: receipt }} />

        <Box my={2} />
      </StyledPaper>
    </>
  );
};
