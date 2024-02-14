import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/system';
import { Button, Paper, Link, Typography, Divider } from '@mui/material';
import { paperStyle } from './LayoutStyles';

export const StyledPaper = ({ extraStyles = {}, ...props }) => {
  const theme = useTheme();
  return <Paper sx={paperStyle(theme, extraStyles)} {...props} />;
};

export const StyledButton = styled(Button)(({ theme, palette }) => ({
  borderColor: theme.palette[palette].main,
  color: theme.palette[palette].main,
  '&:hover': { 
    borderColor: theme.palette[palette].hover,
    color: theme.palette[palette].hover,
    backgroundColor: theme.palette[palette].background,
  },
  '&:active': { 
    borderColor: theme.palette[palette].active,
    color: theme.palette[palette].active,
  },
  '&:focus': {
    borderColor: theme.palette[palette].hover,
    color: theme.palette[palette].hover,
  },
}));

export const StyledLink = ({ children, internal=false, to, ...props }) => {
  return (
    <Link
      href={to}
      color='secondary'
      target={internal ? '' : '_blank'}
      rel={internal ? '' : 'noreferrer'}
      {...props}
    >
      {children}
    </Link>
  );
}

export const Title = ({ children, ...props }) => {
  return (
    <Typography variant="h6" gutterBottom sx={{ mb: 2 }} {...props}>
      {children}
    </Typography>
  );
};

export const PageTitle = ({ children, ...props }) => {
  return (
    <>
      <Typography variant="h4" align='center' {...props}>
        {children}
      </Typography>
      <SectionDivider/>
    </>
  );
};

export const Header = ({ children, ...props }) => {
  return (
    <Typography variant="h6" gutterBottom sx={{ mt: 3 }} {...props}>
      {children}
    </Typography>
  );
};

export const Paragraph = ({ children, ...props }) => {
  return (
    <Typography variant="body1" sx={{ my: 2 }} {...props}>
      {children}
    </Typography>
  )
}

export const SectionDivider = ({ children, ...props }) => {
  return (
    <Divider component="hr" sx={{borderBottomWidth: 4, my: 4 }}/>
  )
}
