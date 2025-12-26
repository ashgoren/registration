import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/system';
import { Paper, Link, Typography, Divider, FormLabel, Box } from '@mui/material';
import { paperStyle } from './LayoutStyles';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { PaperProps } from '@mui/material/Paper';
import type { TypographyProps } from '@mui/material/Typography';
import type { LinkProps } from '@mui/material/Link';

interface StyledPaperProps extends PaperProps {
  extraStyles?: SxProps<Theme>;
}

interface TypographyComponentProps extends TypographyProps {
  children: ReactNode;
}

interface LinkComponentProps extends LinkProps {
  children: ReactNode;
}

const StyledPaper = ({ extraStyles, ...props }: StyledPaperProps) => {
  const theme: Theme = useTheme();
  return <Paper sx={paperStyle(theme, extraStyles)} {...props} />;
};

const SectionDivider = () => {
  return <Divider component='hr' sx={{borderBottomWidth: 4, my: 4 }} />
}

const Title = ({ children, ...props }: TypographyComponentProps) => {
  return (
    <Typography variant='h6' gutterBottom sx={{ mb: 2 }} {...props}>
      {children}
    </Typography>
  );
};

const PageTitle = ({ children, ...props }: TypographyComponentProps) => {
  return (
    <>
      <Typography variant='h4' align='center' {...props}>
        {children}
      </Typography>
      <SectionDivider/>
    </>
  );
};

const Header = ({ children, ...props }: TypographyComponentProps) => {
  return (
    <Typography variant='h6' gutterBottom sx={{ mt: 3 }} {...props}>
      {children}
    </Typography>
  );
};

const Paragraph = ({ children, ...props }: TypographyComponentProps) => {
  return (
    <Typography variant='body1' sx={{ my: 2 }} {...props}>
      {children}
    </Typography>
  )
}

interface StyledLinkProps extends LinkComponentProps {
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
        {required && <Typography component='span'> *</Typography>}
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
