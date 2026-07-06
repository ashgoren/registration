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
        fontFamily: '"Geist", sans-serif',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: 'grid',
          gridTemplateColumns: hasLinks ? 'auto 1fr auto' : '1fr auto',
          alignItems: 'center',
          columnGap: 3,
          rowGap: 1,
          px: 3,
          py: 1.5,
          minHeight: { xs: 0, sm: 0 },
        }}
      >
        <Link
          component={RouterLink}
          to='/'
          underline='none'
          sx={{
            gridColumn: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.75 / 1.125,
            letterSpacing: '-0.025em',
          }}
        >
          {config.navbar.brand && <Box component='img' src={config.navbar.brand} alt='' sx={{ height: 40, flexShrink: 0 }} />}
          <Box sx={hasLinks ? undefined : { flex: 1, textAlign: 'center' }}>{`${config.event.title} Registration`}</Box>
        </Link>

        {/* Centered in column 2 (the 1fr track) so it stays truly centered between the title and
            controls no matter their width, without overlapping either — matches the companion
            static site's grid-based Navbar (static-site-kit). Pinned via gridColumn so it doesn't
            shift into column 3 when hidden below md. */}
        {hasLinks && (
          <Box sx={{ gridColumn: 2, display: 'none', [DESKTOP_NAV_QUERY]: { display: 'flex' }, flexWrap: 'wrap', justifyContent: 'center', columnGap: 3, rowGap: 0.5, fontSize: '1rem', lineHeight: 1.5 }}>
            {navLinks.map((link) => (
              <NavItem key={link.label} link={link} accent={accent} />
            ))}
          </Box>
        )}

        <Box sx={{ gridColumn: hasLinks ? 3 : 2, display: 'flex', alignItems: 'center' }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 3, pb: 2, fontSize: '1rem', lineHeight: 1.5 }}>
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
