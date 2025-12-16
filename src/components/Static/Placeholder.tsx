import { MaterialLayout } from 'components/layouts';
import { Typography } from '@mui/material';
import { StyledPaper, StyledLink, Paragraph } from 'components/layouts/SharedStyles';
import { websiteLink } from 'utils/misc';
import { config } from 'config';

export const Placeholder = () => {
  return (
    <MaterialLayout>
      <StyledPaper>
        Join us at <StyledLink to={websiteLink(config.links.info)}>{config.event.title}</StyledLink>!<br />
        <Paragraph>Camp is {config.event.date} at {config.event.location}.</Paragraph>
        <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
          Registration will open soon!
        </Typography>
        <Paragraph>
          For more info, visit <StyledLink to={websiteLink(config.links.info)}>{config.links.info}</StyledLink>.
        </Paragraph>
      </StyledPaper>
    </MaterialLayout>
  );
};
