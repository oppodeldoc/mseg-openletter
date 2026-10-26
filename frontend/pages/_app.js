import React from 'react';
import { ThemeProvider } from 'styled-components';
import { IntlContext, getMessagesForLocale } from '../lib/i18n';
import Header from '../components/Header';
import '../styles/tailwind.css';
import { useRouter } from 'next/router';

const theme = {
  fontSizes: ['12pt', '16pt', '24pt', '32pt', '48pt', '64pt'],
  colors: { primary: '#026937' },
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const locale = router.locale;
  const messages = getMessagesForLocale(locale);
  return (
    <IntlContext.Provider value={{ locale, messages }}>
      <ThemeProvider theme={theme}>
        <Header />
        <Component {...pageProps} />
      </ThemeProvider>
    </IntlContext.Provider>
  );
}

export default MyApp;
