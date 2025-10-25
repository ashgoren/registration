import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/system';
import { Paper, Link, Typography, Divider, FormLabel, Box } from '@mui/material';
import { paperStyle } from './LayoutStyles';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { PaperProps } from '@mui/material/Paper';

interface StyledPaperProps extends PaperProps {
  extraStyles?: SxProps<Theme>;
}

const StyledPaper = ({ extraStyles = {}, ...props }: StyledPaperProps) => {
  const theme = useTheme();
  return <Paper sx={paperStyle(theme, extraStyles)} {...props} />;
};

const SectionDivider = () => {
  return <Divider component='hr' sx={{borderBottomWidth: 4, my: 4 }} />
}

interface BaseComponentProps {
  children: ReactNode;
}

const Title = ({ children, ...props }: BaseComponentProps) => {
  return (
    <Typography variant='h6' gutterBottom sx={{ mb: 2 }} {...props}>
      {children}
    </Typography>
  );
};

const PageTitle = ({ children, ...props }: BaseComponentProps) => {
  return (
    <>
      <Typography variant='h4' align='center' {...props}>
        {children}
      </Typography>
      <SectionDivider/>
    </>
  );
};

const Header = ({ children, ...props }: BaseComponentProps) => {
  return (
    <Typography variant='h6' gutterBottom sx={{ mt: 3 }} {...props}>
      {children}
    </Typography>
  );
};

const Paragraph = ({ children, ...props }: BaseComponentProps) => {
  return (
    <Typography variant='body1' sx={{ my: 2 }} {...props}>
      {children}
    </Typography>
  )
}

interface StyledLinkProps extends BaseComponentProps {
  internal?: boolean;
  to: string;
}

const StyledLink = ({ children, internal=false, to, ...props }: StyledLinkProps) => {
  return internal ? (
    <Link component={RouterLink} to={to} color='secondary'>
      {children}
    </Link>
  ) : (
    <Link href={to} color='secondary' target='_blank' rel='noreferrer' {...props}>
      {children}
    </Link>
  );
}

interface LabelProps {
  children: ReactNode;
  name?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
}

const Label = ({ children, name = '', required = false, sx }: LabelProps) => {
  return (
    <Box sx={sx}>
      <FormLabel component='legend' htmlFor={name}>
        <Typography component='span' color='text.primary'>{children}</Typography>
        {required && <Typography component='span' color='error'> *</Typography>}
      </FormLabel>
    </Box>
  );
}

const TestCardBox = ({ number }: { number: number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '3rem', my: 2, backgroundColor: 'var(--color-error)' }}>
    Testing: {number} / any future expiration / any cvc / any zip
  </Box>
);

export { StyledPaper, StyledLink, Title, PageTitle, Header, Paragraph, SectionDivider, Label, TestCardBox };
