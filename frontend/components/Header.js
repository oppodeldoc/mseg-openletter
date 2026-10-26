import { withIntl } from '../lib/i18n';

// Letterhead-style bar: MSEG wordmark on white with the brand-green rule beneath.
// (The white logo's green accent letters disappear on a green bar.)
function Header({ t }) {
  return (
    <header className="bg-white border-b-4 border-brand-green">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <a
          href="https://ousd-mseg.org"
          className="flex items-center no-underline focus:outline-none focus:ring-2 focus:ring-brand-green rounded"
          aria-label={t('header.home')}
        >
          <img src="/images/mseg-logo.png" alt="OUSD MSEG" className="h-10 w-auto my-0" />
        </a>
        <a
          href="https://ousd-mseg.org"
          className="text-sm font-medium no-underline text-brand-green hover:underline focus:outline-none focus:ring-2 focus:ring-brand-green rounded px-1"
        >
          {t('header.back')} →
        </a>
      </div>
    </header>
  );
}

export default withIntl(Header);
