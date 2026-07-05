import { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Link, Collapse } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ColorModeToggle } from './ColorModeToggle';
import { config } from 'config';
import { websiteLink } from 'utils/misc';

type NavLink = { label: string; href: string; internal?: boolean };

// matches static-site-kit's default Tailwind `md:` breakpoint, so if this app has a companion
// static site built with static-site-kit, both navbars collapse to a hamburger at the same width
const DESKTOP_NAV_QUERY = '@media (min-width:768px)';

// in registration-only deployments (no companion static site) there's nothing to link to
const navLinks: NavLink[] = config.registrationOnly ? [] : [
  ...config.navbar.links.map(({ label, path }) => ({
    label,
    href: websiteLink(`${config.links.info}${path}`),
  })),
  // registration route only exists once launched (see identical gate in App.tsx)
  ...(config.productionMode || config.env !== 'prd') ? [{ label: 'Registration', href: '/registration', internal: true }] : [],
];

export const Navbar = () => {
  const theme = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const accentOverride = config.navbar.accent;
  const accent = accentOverride ? (theme.palette.mode === 'dark' ? accentOverride.dark : accentOverride.light) : theme.palette.primary.main;
  const hasLinks = navLinks.length > 0;
  const closeMenu = () => setOpen(false);

  return (
    <AppBar
      position='relative'
      elevation={0}
      sx={{
        backgroundColor: alpha(accent, 0.1),
        borderBottom: `1px solid ${alpha(accent, 0.3)}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar disableGutters sx={{ flexWrap: 'wrap', columnGap: 3, rowGap: 1, px: 3, py: 1.5 }}>
        <Link
          component={RouterLink}
          to='/'
          underline='none'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            fontWeight: 600,
            fontSize: '1.125rem',
            ...(hasLinks ? { flexShrink: 0 } : { flex: 1 }),
          }}
        >
          {config.navbar.brand && <Box component='img' src={config.navbar.brand} alt='' sx={{ height: 40, flexShrink: 0 }} />}
          <Box sx={hasLinks ? undefined : { flex: 1, textAlign: 'center' }}>{`${config.event.title} Registration`}</Box>
        </Link>

        {hasLinks && (
          <Box sx={{ display: 'none', [DESKTOP_NAV_QUERY]: { display: 'flex' }, flex: 1, flexWrap: 'wrap', justifyContent: 'center', columnGap: 3, rowGap: 0.5 }}>
            {navLinks.map((link) => (
              <NavItem key={link.label} link={link} accent={accent} active={!!link.internal && location.pathname.startsWith(link.href)} />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <ColorModeToggle />
          {hasLinks && (
            <IconButton
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              color='inherit'
              sx={{ display: 'inline-flex', [DESKTOP_NAV_QUERY]: { display: 'none' } }}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {hasLinks && (
        <Collapse in={open} sx={{ display: 'block', [DESKTOP_NAV_QUERY]: { display: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 3, pb: 2 }}>
            {navLinks.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                accent={accent}
                active={!!link.internal && location.pathname.startsWith(link.href)}
                onClick={closeMenu}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </AppBar>
  );
};

interface NavItemProps {
  link: NavLink;
  accent: string;
  active: boolean;
  onClick?: () => void;
}

const NavItem = ({ link, accent, active, onClick }: NavItemProps) => {
  const sx = {
    color: active ? accent : 'inherit',
    opacity: active ? 1 : 0.6,
    fontWeight: active ? 600 : 400,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 1 },
  };

  return link.internal ? (
    <Link component={RouterLink} to={link.href} underline='none' onClick={onClick} sx={sx}>{link.label}</Link>
  ) : (
    <Link href={link.href} underline='none' onClick={onClick} sx={sx}>{link.label}</Link>
  );
};
