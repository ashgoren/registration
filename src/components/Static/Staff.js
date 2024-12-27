import { Box } from '@mui/material';
import { StyledPaper, PageTitle, Paragraph, SectionDivider, Header } from 'components/Layout/SharedStyles';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Staff() {
  const location = useLocation();
  useEffect(() => {
    const element = document.getElementById(location.hash.replace('#', ''));
    if (element) element.scrollIntoView();
  }, [location]);

  return (
    <StyledPaper extraStyles={{ maxWidth: 750 }}>
      <PageTitle>Bands & Callers</PageTitle>

      <Box>
        <Header id="caller1">Calling by <em>Seth Tepfer</em></Header>
        <Box sx={{ mt: 2, pr: 4, float: { xs: 'none', sm: 'left' } }}>
          <img src={process.env.PUBLIC_URL + '/some_event/SethTepfer.jpg'} alt="Seth Tepfer" />
        </Box>
        <Paragraph sx={{ pt: 1, mb: 0 }}>
          Seth Tepfer is "Atlanta's Dance Magician," calling dances for adults and children like you've never seen before. 
          Known for his infectious energy, his short walk-thrus, and his 'hash-contras', 
          Seth's warm enthusiasm is contagious, and gets everyone moving, smiling, and having a great time. 
          Whether squares, contras, or other folk dances, you can be certain that all involved - 
          novices and experienced dancers alike - will amble away happy and eager to dance more!
        </Paragraph>
      </Box>
      <Box sx={{ clear: 'both' }} />

      <Box sx={{ mt: 6 }}>
        <Header id="caller2">Calling by <em>Will Mentor</em></Header>
        <Box sx={{ mt: 2, pl: { xs: 'none', sm: 4 }, float: { xs: 'none', sm: 'right' } }}>
          <img src={process.env.PUBLIC_URL + '/some_event/WillMentor.jpg'} alt="Will Mentor" />
        </Box>
        <Paragraph sx={{ pt: 1, mb: 0 }}>
          Will Mentor is a contra and square dance caller from Northern Vermont known for his clear teaching, upbeat wit, and relaxed stage presence. 
          He loves to choreograph evenings with a variety of dances and tempos that at times surprise and always delight, 
          all the while keeping intact his guiding principle as a caller: "It's about the dancers!"
        </Paragraph>
      </Box>
      <Box sx={{ clear: 'both' }} />

      <SectionDivider />

      <Header id="band1">Music by <em>Notorious</em></Header>
      <Box>
        <Box sx={{ mt: 2, pl: { xs: 'none', sm: 4 }, float: { xs: 'none', sm: 'right' } }}>
          <img src={process.env.PUBLIC_URL + '/some_event/notorious.jpeg'} alt="Notorious"  style={{ width: 300 }} />
        </Box>
        <Paragraph sx={{ pt: 1, mb: 0 }}>
          Lauded as "sparkling" and "exhilarating” Notorious Folk musicians Eden MacAdam-Somer, Larry Unger, Sam Bartlett, Mark "Pokey" Hellenberg, and Mark Murphy present a thrilling musical experience in genres that span many continents, lighting up the dance hall with rhythm and sonority. Notorious has been a featured ensemble in various configurations at dance weekends, festivals, and concert halls spanning the contiguous US, Alaska, Hawaii, Europe, India, and Afghanistan. We are psyched to be back in the dance hall together, playing for you!!!
        </Paragraph>
      </Box>
      <Box sx={{ clear: 'both' }} />

      <Header id="band2">Music by <em>Playing with Fyre</em></Header>
      <Box>
        <Box sx={{ mt: 2, pr: { xs: 'none', sm: 4 }, float: { xs: 'none', sm: 'left' } }}>
          <img src={process.env.PUBLIC_URL + '/some_event/playing-with-fyre.png'} alt="Playing with Fyre"  style={{ width: 300 }} />
        </Box>
        <Paragraph sx={{ pt: 1, mb: 0 }}>
          Playing With Fyre is a very unique, dynamic contra dance band that plays within the unparalleled passion of the moment. They bring a unique blend of trad, jazz, old time, funk, and blues and will take you on an emotionally driven dance journey!  Love the music, Live the moment,  Dance from your heart! George Paul on Keys, Rob Zisette on Fiddle, Dave Bartley on Stringed Instruments.
        </Paragraph>
      </Box>
      <Box sx={{ clear: 'both' }} />
    </StyledPaper>
  );
}
