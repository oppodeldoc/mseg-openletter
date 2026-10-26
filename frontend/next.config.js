require('dotenv').config();

var locales = require('./constants/locales');

// All three are read at BUILD time (Vercel: redeploy after changing them).
const API_URL = process.env.API_URL || 'http://localhost:3000';
const PRIVACY_URL = process.env.PRIVACY_URL || 'https://ousd-mseg.org/pages/privacy';
// Slug of MSEG's statement; when set, `/` redirects straight to it.
const LETTER_SLUG = process.env.LETTER_SLUG || '';
// Letter creation/edition is a one-time admin task; keep `/create` a 404 otherwise.
const ALLOW_LETTER_CREATE = process.env.ALLOW_LETTER_CREATE === 'true' ? 'true' : 'false';

module.exports = {
  env: {
    API_URL,
    PRIVACY_URL,
    LETTER_SLUG,
    ALLOW_LETTER_CREATE,
  },
  async redirects() {
    const redirects = [
      // Redirect /$slug/$locale to /$locale/$slug
      {
        source: '/:slug/:locale(\\w{2})',
        destination: '/:locale/:slug',
        permanent: false,
      },
    ];
    if (LETTER_SLUG) {
      redirects.unshift({ source: '/', destination: `/${LETTER_SLUG}`, permanent: false });
    }
    return redirects;
  },
  i18n: {
    locales: Object.keys(locales),
    defaultLocale: 'en',
  },
  compiler: {
    // SWC replacement for babel-plugin-styled-components: stable class names
    // between server and client render (avoids hydration mismatches).
    styledComponents: true,
  },
};
