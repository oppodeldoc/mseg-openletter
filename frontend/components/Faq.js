import { withIntl } from '../lib/i18n';

const Q = ({ children }) => (
  <summary className="text-lg text-brand-ink cursor-pointer font-semibold mt-4 marker:text-brand-green">{children}</summary>
);
const A = (props) => (
  <p className="pt-1 text-base text-gray-700" {...props}>
    {props.children}
  </p>
);

export default withIntl(({ t }) => (
  <div>
    <h2 className="text-2xl font-bold mb-8 brand-underline">{t('faq')}</h2>
    <div className="space-y-8">
      <details>
        <Q>{t('faq.q1')}</Q>
        <A>{t('faq.q1.response')}</A>
      </details>
      <details>
        <Q>{t('faq.q2')}</Q>
        <A>{t('faq.q2.response')}</A>
      </details>
      <details>
        <Q>{t('faq.q3')}</Q>
        <A>{t('faq.q3.response')}</A>
      </details>
      <details>
        <Q>{t('faq.q4')}</Q>
        <A>{t('faq.q4.response')}</A>
      </details>
      <details>
        <Q>{t('faq.q5')}</Q>
        <A>{t('faq.q5.response')}</A>
      </details>
      <details>
        <Q>{t('faq.q8')}</Q>
        <A dangerouslySetInnerHTML={{ __html: t('faq.q8.response') }} />
      </details>
    </div>
  </div>
));
