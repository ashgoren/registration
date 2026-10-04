import { useState } from 'react';
import { Box, Link, Collapse } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { ColorModeToggle } from './ColorModeToggle';
import { config } from 'config';
import { websiteLink } from 'utils/misc';

// Mirrors the companion static site's Navbar (static-site-kit), so the two sites look
// interchangeable: same markup structure, grid layout, breakpoints, spacing, type, and controls.
// Site-specific values (title, logo, links & static-site-kit's layout options in configEvent's
// `navbar`, accent color in configTheme's `colors`) come from config and should match the static
// site's. static-site-kit's `headerImage` layout isn't supported.

type NavLink = { label: string; href: string; current?: boolean };

// matches static-site-kit's default Tailwind `md:` breakpoint, so both navbars collapse to a
// hamburger at the same width
const DESKTOP_NAV_QUERY = '@media (min-width:768px)';
// static-site-kit's Tailwind `lg:` breakpoint, where the full title has room again next to the links
const WIDE_NAV_QUERY = '@media (min-width:1024px)';

const { title, shortTitle, brand, brandWidth, brandHeight, centerLinksOnPage, tinted, links } = config.navbar;

// Links are copied as-is from the static site's config, so a root-relative href ('/about') is a
// page on the static site and gets its domain prepended; a full URL is used unchanged
const navLinks: NavLink[] = links.map((link) => ({
  ...link,
  href: link.href.startsWith('/') ? websiteLink(`${config.links.info}${link.href}`) : link.href,
}));

export const Navbar = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { accent } = config.theme.colors[theme.palette.mode];
  const closeMenu = () => setOpen(false);

  return (
    <Box
      component='header'
      sx={{
        backgroundColor: tinted ? alpha(accent, 0.1) : 'background.default',
        borderBottom: `1px solid ${alpha(accent, 0.3)}`,
        color: 'text.primary',
        fontFamily: '"Geist", sans-serif',
      }}
    >
      {/* position: relative anchors the links when centerLinksOnPage absolutely positions them */}
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          columnGap: 3,
          rowGap: 1,
          px: 3,
          py: 1.5,
        }}
      >
        {/* Only rendered when there's a menu to open. Rendered first so it's also first in tab
            order, matching its visual position. */}
        {navLinks.length > 0 && (
          <Box
            component='button'
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            sx={{
              // reset browser button styles (static-site-kit gets this from Tailwind's preflight)
              border: 0,
              background: 'none',
              color: 'inherit',
              // col-start-1 md:hidden w-9 flex flex-col items-center gap-1.5 p-1
              gridColumn: 1,
              width: 36,
              display: 'flex',
              [DESKTOP_NAV_QUERY]: { display: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              p: 0.5,
            }}
          >
            <HamburgerIcon open={open} />
          </Box>
        )}

        {/* Below md, sits in column 2, centered between the hamburger (column 1) and the controls
            (column 3), where the links are hidden; at md+, moves to column 1, left-aligned, ahead
            of the centered links. */}
        <Link
          component={RouterLink}
          to='/'
          underline='none'
          sx={{
            gridColumn: 2,
            justifyContent: 'center',
            [DESKTOP_NAV_QUERY]: { gridColumn: 1, justifyContent: 'flex-start' },
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
          {/* Width & height attributes plus max-width: 100% & height: auto (Tailwind's preflight
              img defaults on the static site) render it at that size, scaling down proportionally
              when there isn't room. Decorative (empty alt) when the title names the link;
              otherwise the image is the link's only content, so its alt text has to name it for
              screen readers. */}
          {brand && (
            <Box
              component='img'
              src={brand}
              width={brandWidth}
              height={brandHeight}
              alt={title ? '' : config.event.title}
              sx={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
          {/* With a shortTitle, the full title shows below md (links are hidden, so there's no
              space pressure) and at lg+ (room again); the short one only in the md-to-lg band
              where the title competes with the links for space */}
          {shortTitle ? (
            <>
              <Box component='span' sx={{ [DESKTOP_NAV_QUERY]: { display: 'none' }, [WIDE_NAV_QUERY]: { display: 'inline' } }}>{title}</Box>
              <Box component='span' sx={{ display: 'none', [DESKTOP_NAV_QUERY]: { display: 'inline' }, [WIDE_NAV_QUERY]: { display: 'none' } }}>{shortTitle}</Box>
            </>
          ) : (
            title
          )}
        </Link>

        {/* By default, centered in column 2 (the 1fr track) so it stays truly centered between the
            title and controls no matter their width, without overlapping either; wraps to a second
            line rather than overlapping when it doesn't fit. Pinned via gridColumn so it doesn't
            shift into column 3 when hidden below md.
            With centerLinksOnPage, it's instead absolutely centered on the full navbar width, so it
            lines up with page content centered below the navbar - at the cost of that overlap
            protection. */}
        <Box
          sx={{
            ...(centerLinksOnPage
              ? { position: 'absolute', left: '50%', transform: 'translateX(-50%)' }
              : { gridColumn: 2 }),
            display: 'none',
            [DESKTOP_NAV_QUERY]: { display: 'flex' },
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: 3,
            rowGap: 0.5,
            fontSize: '1rem',
            lineHeight: 1.5,
          }}
        >
          {navLinks.map((link) => (
            <NavItem key={link.label} link={link} accent={accent} />
          ))}
        </Box>

        <Box sx={{ gridColumn: 3 }}>
          <ColorModeToggle />
        </Box>
      </Box>

      <Collapse in={open} sx={{ display: 'block', [DESKTOP_NAV_QUERY]: { display: 'none' } }}>
        {/* text-sm and px-4, matching static-site-kit's mobile drawer */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 2, pb: 2, fontSize: '0.875rem', lineHeight: 1.25 / 0.875 }}>
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
    </Box>
  );
};

// static-site-kit's hamburger: three 20x2px bars that animate into an X when open (top and bottom
// bars move to the middle and rotate; the middle bar fades out)
const HamburgerIcon = ({ open }: { open: boolean }) => {
  const bar = {
    display: 'block',
    width: 20,
    height: 2,
    backgroundColor: 'text.primary',
    transformOrigin: 'center',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <>
      <Box component='span' sx={{ ...bar, transform: open ? 'translateY(8px) rotate(45deg)' : 'none' }} />
      <Box component='span' sx={{ ...bar, opacity: open ? 0 : 1 }} />
      <Box component='span' sx={{ ...bar, transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
    </>
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
    opacity: link.current ? 1 : 0.7,
    fontWeight: link.current ? 600 : 400,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 1 },
  };

  return <Link href={link.href} underline='none' onClick={onClick} sx={sx}>{link.label}</Link>;
};
