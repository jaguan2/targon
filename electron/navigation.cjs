/** Only an explicitly local development server may replace the bundled UI. */
function developmentUrl(value, packaged) {
  if (!value || packaged) return null;
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) {
    throw new Error('VITE_DEV_SERVER_URL must be a local HTTP development server.');
  }
  return url;
}

function isAppNavigation(value, { indexUrl, devUrl }) {
  try {
    const target = new URL(value);
    if (devUrl) return target.origin === devUrl.origin;
    const index = new URL(indexUrl);
    return target.protocol === 'file:' && target.host === index.host && target.pathname === index.pathname && target.search === index.search;
  } catch {
    return false;
  }
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

module.exports = { developmentUrl, isAppNavigation, externalUrl };
