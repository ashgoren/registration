import { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Link, Collapse } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { ColorModeToggle } from './ColorModeToggle';
import { config } from 'config';
import { websiteLink } from 'utils/misc';

type NavLink = { label: string; href: string; current?: boolean };

// matches static-site-kit's default Tailwind `md:` breakpoint, so if this app has a companion
// static site built with static-site-kit, both navbars collapse to a hamburger at the same width
const DESKTOP_NAV_QUERY = '@media (min-width:768px)';

// in standalone deployments (no companion static site) there's nothing to link to
const navLinks: NavLink[] = config.standalone ? [] : [
  ...config.navbar.links.map(({ label, path }) => ({
    label,
    href: websiteLink(`${config.links.info}${path}`),
  })),
  { label: 'Registration', href: '/', current: true },
];

export const Navbar = () => {
  const theme = useTheme();
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
              <NavItem key={link.label} link={link} accent={accent} />
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
  onClick?: () => void;
}

const NavItem = ({ link, accent, onClick }: NavItemProps) => {
  const sx = {
    color: link.current ? accent : 'inherit',
    opacity: link.current ? 1 : 0.6,
    fontWeight: link.current ? 600 : 400,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 1 },
  };

  return link.current ? (
    <Link component={RouterLink} to={link.href} underline='none' onClick={onClick} sx={sx}>{link.label}</Link>
  ) : (
    <Link href={link.href} underline='none' onClick={onClick} sx={sx}>{link.label}</Link>
  );
};
