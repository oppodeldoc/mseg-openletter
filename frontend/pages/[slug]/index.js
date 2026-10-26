import React, { Component } from 'react';
import fetch from 'node-fetch';
import Footer from '../../components/Footer';
import { Flex, Box } from 'reflexbox/styled-components';
import NumberFormat from 'react-number-format';
import SignatureForm from '../../components/SignatureForm';
import Notification from '../../components/Notification';
import SignatureEmailSent from '../../components/SignatureEmailSent';
import SignatureUpdated from '../../components/SignatureUpdated';
import Signatures from '../../components/Signatures';
import SignaturesCount from '../../components/SignaturesCount';
import Updates from '../../components/Updates';
import LocaleSelector from '../../components/LocaleSelector';
import { withIntl } from '../../lib/i18n';
import { fetchJson } from '../../lib/api';
import { replaceURLsWithMarkdownAnchors, restoreBlockquotes } from '../../lib/utils';
import moment from 'moment';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import url from 'url';
import Link from 'next/link';
import Image from 'next/image';

const Page = ({ children, className }) => <div className={`max-w-4xl mx-auto ${className}`}>{children}</div>;
const Title = ({ children, className }) => (
  <h1 className={`text-3xl md:text-4xl font-bold mt-1 mb-6 leading-tight brand-underline ${className || ''}`}>{children}</h1>
);
const Text = ({ children }) => <div className="max-w-2xl">{children}</div>;

// Markdown the statement body may use. Anything else (tables, code, raw HTML) is
// unwrapped so its text still shows instead of disappearing.
const markdownAllowedElements = ['a', 'br', 'p', 'b', 'i', 'strong', 'em', 'img', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr'];
const markdownComponents = {
  // the letter title is the page's h1; demote author headings so the outline stays sane
  h1: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-3 leading-tight">{children}</h2>,
  h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-3 leading-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-2 leading-tight">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-6 my-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-6 my-4 space-y-1">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-gray-300 dark:border-gray-600" />,
};
const ViewMore = ({ children }) => <div className="text-center">{children}</div>;

class Letter extends Component {
  constructor(props) {
    super(props);
    this.state = { status: null };

    this.submitSignature = this.submitSignature.bind(this);
  }

  componentDidMount() {
    if (document.referrer.match(/\/confirm_signature\?token=/)) {
      this.setState({ status: 'confirmed' });
    }
    if (document.referrer.match(/\/create/)) {
      this.setState({ status: 'created' });
    }
  }

  async submitSignature(signature) {
    console.log('>>> submitting ', signature, 'headers', this.props.headers);
    const apiCall = `${process.env.API_URL}/letters/${this.props.letter.slug}/${this.props.letter.locale}/sign`;

    try {
      const res = await fetch(apiCall, {
        method: 'post',
        body: JSON.stringify(signature),
        headers: { 'Content-Type': 'application/json', 'accept-language': this.props.headers['accept-language'] },
      });
      const json = await res.json();
      if (json.error) {
        this.setState({ status: 'error', error: json.error });
        return;
      }

      this.setState({ status: signature.token ? 'signature_updated' : 'signature_sent' });
    } catch (e) {
      console.error('>>> API error', e);
      this.setState({ status: 'error', error: { message: this.props.t('error.server') } });
      setTimeout(() => {
        this.setState({ status: null, error: null });
      }, 5000);
    }
  }

  render() {
    const { letter, error, t, locale } = this.props;
    const { status } = this.state;

    if (error) {
      return (
        <Page>
          <Notification title="Unable to load this letter" message={error.message} icon="error" />
        </Page>
      );
    } else if (!letter) {
      return (
        <Page>
          <Notification title="Loading..." />
        </Page>
      );
    }

    const text = replaceURLsWithMarkdownAnchors(restoreBlockquotes(letter.text.replace(/<br ?\/> ?/g, '\n')));

    return (
      <div>
        <Head>
          <title>{letter.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta property="og:title" content={letter.title} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content={letter.image ? letter.image.src : `${process.env.SITE_URL}/images/og-default.png`} />
          <meta property="og:image" content={letter.image ? letter.image.src : `${process.env.SITE_URL}/images/og-default.png`} />
        </Head>
        <Page className="letter px-2 md:px-0 mt-6">
          {status === 'created' && (
            <Notification
              icon="signed"
              title={t('notification.published')}
              message={t('notification.published.info')}
            />
          )}
          {status === 'confirmed' && (
            <Notification icon="signed" title={t('notification.signed')} message={t('notification.signed.info')} />
          )}
          <Flex flexWrap="wrap">
            <Box width={[1, 2 / 3]} p={3}>
              <LocaleSelector slug={letter.slug} locales={letter.locales} currentLocale={letter.locale} />
              <div className="text-sm font-semibold uppercase tracking-wide text-brand-green">
                {moment.utc(letter.created_at).format('D MMMM YYYY')}
              </div>
              <Title>{letter.title}</Title>
              {letter.image && letter.image.src && (
                <div className="w-full">
                  <img
                    width={letter.image.width}
                    height={letter.image.height}
                    src={`/api/image?imageUrl=${encodeURIComponent(letter.image.src)}`}
                  />
                </div>
              )}
              <Text>
                <ReactMarkdown
                  plugins={[gfm]}
                  allowedElements={markdownAllowedElements}
                  unwrapDisallowed
                  components={markdownComponents}
                >
                  {text}
                </ReactMarkdown>
              </Text>
              <Updates updates={letter.updates} />
            </Box>
            {letter.type === 'letter' && (
              <Box width={[1, 1 / 3]} p={3}>
                <SignaturesCount signatures={letter.signatures} stats={letter.signatures_stats} />
                {[null, 'created', 'error'].includes(status) && (
                  <SignatureForm
                    letter={letter}
                    error={this.state.error}
                    signature={this.props.signature}
                    onSubmit={(signature) => this.submitSignature(signature)}
                  />
                )}
                {status === 'signature_sent' && <SignatureEmailSent />}
                {status === 'signature_updated' && <SignatureUpdated letter={letter} />}
                {(letter.signatures_stats.verified <= 100 || !letter.first_verified_signatures) && (
                  <Signatures signatures={letter.signatures} total={letter.signatures_stats.verified} />
                )}
                {letter.signatures_stats.verified > 100 && letter.first_verified_signatures && (
                  <>
                    <Signatures
                      signatures={letter.first_verified_signatures}
                      latest={letter.latest_verified_signatures}
                      total={letter.signatures_stats.verified}
                    />
                    <ViewMore className="my-4">
                      <div>
                        ...
                        <br />
                        <NumberFormat
                          value={
                            letter.signatures_stats.verified -
                            letter.first_verified_signatures.length -
                            letter.latest_verified_signatures.length
                          }
                          displayType={'text'}
                          thousandSeparator={true}
                        />{' '}
                        more <br />
                        verified signatures
                      </div>
                      <div>
                        <Link href={`/${letter.slug}?limit=0`} locale={locale}>
                          view all
                        </Link>
                      </div>
                    </ViewMore>
                    <Signatures
                      start={letter.signatures_stats.verified - letter.latest_verified_signatures.length + 1}
                      signatures={letter.latest_verified_signatures}
                      total={letter.signatures_stats.verified}
                    />
                  </>
                )}
              </Box>
            )}
          </Flex>
          <Footer />
        </Page>
      </div>
    );
  }
}

export async function getServerSideProps({ params, req, res, locale }) {
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  const props = { headers: req.headers };
  const parsedUrl = url.parse(req.url, true);
  const limit = parsedUrl.query.limit || 100;
  const token = parsedUrl.query.token || null;
  const apiCall = `${process.env.API_URL}/letters/${params.slug}?locale=${locale}&limit=${limit}`;
  console.log('>>> apiCall', apiCall);

  const { data: letter, error } = await fetchJson(apiCall);
  if (error) {
    props.error = error;
  } else if (letter.error) {
    props.error = letter.error;
  } else {
    props.letter = letter;
  }

  if (token) {
    const { data: signature, error: signatureError } = await fetchJson(`${process.env.API_URL}/signatures/${token}`);
    if (signatureError) {
      props.error = signatureError;
    } else if (signature.error) {
      props.error = signature.error;
    } else {
      signature.token = token;
      props.signature = signature;
    }
  }

  return { props };
}

export default withIntl(Letter);
