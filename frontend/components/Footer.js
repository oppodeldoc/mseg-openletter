import { withIntl } from '../lib/i18n';

const linkClass =
  'text-white/80 no-underline hover:text-white hover:underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-gold rounded px-1';

// Charcoal footer band, as on ousd-mseg.org.
function Footer({ t }) {
  return (
    <footer className="mt-16 bg-brand-charcoal text-white border-t-4 border-brand-gold">
      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col items-center text-center gap-4">
        <a href="https://ousd-mseg.org" className="no-underline" aria-label={t('header.home')}>
          <img src="/images/mseg-logo-light.png" alt="OUSD MSEG" className="h-12 w-auto my-0" />
        </a>
        <p className="text-sm text-white/80 max-w-md">{t('footer.tagline')}</p>
        <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm" aria-label="Footer">
          <a href="https://ousd-mseg.org" className={linkClass}>
            {t('footer.mseg')}
          </a>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <a href={process.env.PRIVACY_URL} className={linkClass}>
            {t('footer.privacy')}
          </a>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <a href="https://github.com/oppodeldoc/mseg-openletter" className={linkClass}>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default withIntl(Footer);
