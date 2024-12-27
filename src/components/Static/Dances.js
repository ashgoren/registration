import { Box, Grid } from '@mui/material';
import { StyledLink, StyledPaper, PageTitle, Paragraph, SectionDivider } from 'components/Layout/SharedStyles';
import config from 'config';
const { DANCES } = config;

const halfLength = Math.ceil(DANCES.length / 2);
const col1 = DANCES.slice(0, halfLength);
const col2 = DANCES.slice(halfLength);

export default function Dances() {
  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }} align="center">
      <PageTitle>
        List of Dances
      </PageTitle>

      <Paragraph>
        Find dance instructions, selected sheet music, and videos in 
        the <StyledLink to="/ecdball/2023PortlandBall_DanceInstructions.pdf">Dance Instructions packet</StyledLink>.
      </Paragraph>

      <Grid container>
        <Grid item xs={12} sm={6}>
          {col1.map((item, index) => (
            <Box key={index} sx={{ border: 'none', mb: 1, p: 1, mr: 2 }}>
              {item}
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} sm={6}>
          {col2.map((item, index) => (
            <Box key={index} sx={{ border: 'none', mb: 1, p: 1, mr: 2 }}>
              {item}
            </Box>
          ))}
        </Grid>
      </Grid>

      <SectionDivider />

      <Paragraph>
        * Indicates that this dance will not be walked and will be prompted during the Ball
      </Paragraph>
      <Paragraph>
        The rest of the dances will be walked and prompted.
      </Paragraph>
      <Paragraph>
        Workshop attendance is advised.
      </Paragraph>
    </StyledPaper>
  );
}
