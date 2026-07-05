export function getCookie(name: string): string | null {
  const target = `${name}=`;
  for (const pair of document.cookie.split('; ')) {
    if (pair.startsWith(target)) return decodeURIComponent(pair.slice(target.length));
  }
  return null;
}

type CookieAttrs = {
  path?: string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

export function setCookie(name: string, value: string, attrs: CookieAttrs = {}): void {
  const { path = '/', maxAge, domain, secure, sameSite } = attrs;
  const parts = [`${name}=${encodeURIComponent(value)}`, `path=${path}`];
  if (maxAge !== undefined) parts.push(`max-age=${maxAge}`);
  if (domain) parts.push(`Domain=${domain}`);
  if (sameSite) parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function deleteCookie(name: string, attrs: Pick<CookieAttrs, 'path' | 'domain'> = {}): void {
  setCookie(name, '', { ...attrs, maxAge: 0 });
}
