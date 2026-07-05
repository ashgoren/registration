import { getCookie, setCookie, deleteCookie } from './cookies';

// If this site has a companion static site built with static-site-kit, its theme.ts
// uses the same cookie name and value format so both sites share one theme preference.
export type ColorMode = 'auto' | 'light' | 'dark';

const COLOR_MODE_COOKIE = 'theme';
const THEME_EVENT = 'theme-change';
const THEME_CHANNEL = 'theme';
const CYCLE: ColorMode[] = ['auto', 'light', 'dark'];

// broadcasts color mode changes to other tabs on this same origin
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(THEME_CHANNEL) : null;

function colorModeCookieDomain(apex: string): string | undefined {
  const { hostname } = window.location;
  const onApexDomain = hostname === apex || hostname.endsWith(`.${apex}`);
  return onApexDomain ? apex : undefined;
}

export function getColorMode(): ColorMode {
  const stored = getCookie(COLOR_MODE_COOKIE);
  return stored === 'light' || stored === 'dark' ? stored : 'auto';
}

// `apex` scopes the cookie to that domain (and its subdomains) so this app can
// stay in sync with a companion static site's theme choice, if there is one.
function setColorMode(mode: ColorMode, apex: string): void {
  const domain = colorModeCookieDomain(apex);
  if (mode === 'auto') {
    deleteCookie(COLOR_MODE_COOKIE, { domain });
  } else {
    setCookie(COLOR_MODE_COOKIE, mode, {
      maxAge: 31536000,
      sameSite: 'Lax',
      domain,
      secure: window.location.protocol === 'https:',
    });
  }
}

// persists the mode and notifies same-tab listeners (window event) and other tabs (BroadcastChannel)
export function applyColorMode(mode: ColorMode, apex: string): void {
  setColorMode(mode, apex);
  window.dispatchEvent(new Event(THEME_EVENT));
  channel?.postMessage(mode);
}

export function nextColorMode(mode: ColorMode): ColorMode {
  return CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
}

// for useSyncExternalStore — notifies on changes from this tab's toggle or another tab's
export function subscribeColorMode(callback: () => void): () => void {
  window.addEventListener(THEME_EVENT, callback);
  channel?.addEventListener('message', callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    channel?.removeEventListener('message', callback);
  };
}

export function resolveColorMode(mode: ColorMode, prefersDark: boolean): 'light' | 'dark' {
  return mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
}
