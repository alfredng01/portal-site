const LOCAL_HOST = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\]|[^./:]+)(:\d+)?(\/|$)/i;

/**
 * Turns loosely typed input like `192.168.1.10:8080` or `github.com` into a full URL.
 * LAN-looking hosts (IPs, `localhost`, single-label names) default to http, everything else to https.
 * Returns `null` if the result still isn't a valid http(s) URL.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `${LOCAL_HOST.test(trimmed) ? 'http' : 'https'}://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Short display form of a URL, e.g. `plex.local:32400/web`. */
export function displayUrl(href: string): string {
  try {
    const url = new URL(href);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return href;
  }
}
