export function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function urlsMatch(a: string, b: string) {
  return normalizeUrl(a) === normalizeUrl(b);
}
