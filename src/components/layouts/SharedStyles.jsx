import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/system';
import { Paper, Link, Typography, Divider, FormLabel, Box } from '@mui/material';
import { paperStyle } from './LayoutStyles';

const StyledPaper = ({ extraStyles = {}, ...props }) => {
  const theme = useTheme();
  return <Paper sx={paperStyle(theme, extraStyles)} {...props} />;
};

const StyledLink = ({ children, internal=false, to, ...props }) => {
  if (internal) {
    return (
      <Link component={RouterLink} to={to} color='secondary'>
        {children}
      </Link>
    );
  } else {
    return (
      <Link href={to} color='secondary' target='_blank' rel='noreferrer' {...props}>
        {children}
      </Link>
    );
  }
}

const Title = ({ children, ...props }) => {
  return (
    <Typography variant="h6" gutterBottom sx={{ mb: 2 }} {...props}>
      {children}
    </Typography>
  );
};

const PageTitle = ({ children, ...props }) => {
  return (
    <>
      <Typography variant="h4" align='center' {...props}>
        {children}
      </Typography>
      <SectionDivider/>
    </>
  );
};

const Header = ({ children, ...props }) => {
  return (
    <Typography variant="h6" gutterBottom sx={{ mt: 3 }} {...props}>
      {children}
    </Typography>
  );
};

const Paragraph = ({ children, ...props }) => {
  return (
    <Typography variant="body1" sx={{ my: 2 }} {...props}>
      {children}
    </Typography>
  )
}

const SectionDivider = () => {
  return (
    <Divider component="hr" sx={{borderBottomWidth: 4, my: 4 }}/>
  )
}

const Label  = ({ children, name = '', required=false, sx={} }) => {
  return (
    <Box sx={sx}>
      <FormLabel component='legend' htmlFor={name}>
        <Typography component='span' color='text.primary'>{children}</Typography>
        {required && <Typography component='span' color='error'> *</Typography>}
      </FormLabel>
    </Box>
  );
}

const TestCardBox = ({ number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3rem', my: 2, backgroundColor: 'var(--color-error)' }}>
    Testing: {number} / any future expiration / any cvc / any zip
  </Box>
);

export { StyledPaper, StyledLink, Title, PageTitle, Header, Paragraph, SectionDivider, Label, TestCardBox };
