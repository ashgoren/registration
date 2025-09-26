import { MaterialLayout } from 'components/layouts';
import { Typography } from '@mui/material';
import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { config } from 'config';
const { EVENT_TITLE, EVENT_LOCATION, EVENT_DATE } = config;

export const Placeholder = () => {
  return (
    <MaterialLayout>
      <StyledPaper>
        <Paragraph>Join us at {EVENT_TITLE}!</Paragraph>
        <Paragraph>Camp is {EVENT_DATE} at {EVENT_LOCATION}.</Paragraph>
        <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
          Registration will open soon!
        </Typography>
      </StyledPaper>
    </MaterialLayout>
  );
};
