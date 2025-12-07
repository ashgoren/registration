import { MaterialLayout } from 'components/layouts';
import { Typography } from '@mui/material';
import { StyledPaper, StyledLink, Paragraph } from 'components/layouts/SharedStyles';
import { websiteLink } from 'utils/misc';
import { config } from 'config';
const { EVENT_TITLE, EVENT_LOCATION, EVENT_DATE, MORE_INFO_URL } = config;

export const Placeholder = () => {
  return (
    <MaterialLayout>
      <StyledPaper>
        Join us at <StyledLink to={websiteLink(MORE_INFO_URL)}>{EVENT_TITLE}</StyledLink>!<br />
        <Paragraph>Camp is {EVENT_DATE} at {EVENT_LOCATION}.</Paragraph>
        <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
          Registration will open soon!
        </Typography>
        <Paragraph>
          For more info, visit <StyledLink to={websiteLink(MORE_INFO_URL)}>{MORE_INFO_URL}</StyledLink>.
        </Paragraph>
      </StyledPaper>
    </MaterialLayout>
  );
};
