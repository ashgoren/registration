import { Box, List, ListItem } from '@mui/material';
import { StyledPaper, StyledLink, PageTitle, Paragraph, Header } from 'components/Layout/SharedStyles';

export default function Seattle() {

  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }}>
      <PageTitle>
        Seattle
      </PageTitle>

      <Box mt={-5} mb={4}>
        <img src={process.env.PUBLIC_URL + '/some_event/seattle.jpg'} alt='' style={{ width: "100%", height: "auto" }} />
      </Box>

      <Header>
        Lake City Contra Dance
      </Header>

      <Paragraph>
        Come dancing the <StyledLink to='https://seattledance.org/contra/lakecity/'>Thursday evening</StyledLink> before some_event! <br />
        Directions to the Lake City contra dance can be found <StyledLink to={process.env.PUBLIC_URL + '/some_event/LakeCityContraMap.pdf'}>here</StyledLink>.
      </Paragraph>

      <Header>
        Dining
      </Header>
      <Paragraph>
        Click <StyledLink to={process.env.PUBLIC_URL + '/some_event/some_event-Dining-Guide-2020.pdf'}>here</StyledLink> to view our dining guide (last updated 2020).<br />
        The new 2023 Ballard dining guide is coming soon.
      </Paragraph>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "column" }, justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Header>
            Around Seattle
          </Header>
          <List>
            <ListItem><StyledLink to="https://fremont.com/explore/sights/">Visit the offbeat art in the Fremont neighborhood and say 'hello' to the Fremont Troll</StyledLink></ListItem>	
            <ListItem><StyledLink to="http://fryemuseum.org">Visit The Frye Art Museum (free)</StyledLink></ListItem>	
            <ListItem><StyledLink to="http://mohai.org">Learn about Seattle history with MOHAI</StyledLink></ListItem>	
            <ListItem><StyledLink to="http://museumofflight.org">Prepare for takeoff at the Museum of Flight</StyledLink></ListItem>	
            <ListItem><StyledLink to="https://volunteerparkconservatory.org">Get a tropical feeling at the Volunteer Park Conservatory</StyledLink></ListItem>	
            <ListItem><StyledLink to="https://www.pacificsciencecenter.org">Question reality or take a walk with butterflies at the Pacific Science Center</StyledLink></ListItem>	
            <ListItem><StyledLink to="https://botanicgardens.uw.edu/washington-park-arboretum/visit/graham-visitors-center/">Take a walk at the Washington Park Arboretum</StyledLink></ListItem>	
            <ListItem><StyledLink to="http://www.undergroundtour.com">Go underground</StyledLink></ListItem>	
            <ListItem><StyledLink to="https://www.elliottbaybook.com/">Find new reading material at The Elliott Bay Book Company</StyledLink></ListItem>	
            <ListItem><StyledLink to="http://www.wingluke.org"> Visit Seattle's Chinatown, especially The Wing</StyledLink></ListItem>	
            <ListItem><StyledLink to="https://seattleboulderingproject.com">Go bouldering with the Seattle Bouldering Project</StyledLink></ListItem>	
          </List>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Header>
            Ballard
          </Header>
          <List>
            <ListItem><StyledLink to="http://ballardlocks.org" target="_blank" rel="noreferrer">Visit the Ballard Locks</StyledLink></ListItem>
            <ListItem><StyledLink to="http://www.seattle.gov/parks/find/parks/golden-gardens-park" target="_blank" rel="noreferrer">Take a walk at the Golden Gardens Park.</StyledLink></ListItem>
            <ListItem><StyledLink to="http://www.sfmamarkets.com/visit-ballard-farmers-market">And, if you can tear yourself away from dancing, the Ballard Farmers Market is year-round</StyledLink></ListItem>
          </List>
        </Box>
      </Box>
    </StyledPaper>
  );
}
