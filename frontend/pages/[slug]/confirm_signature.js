import React, { Component } from 'react';
import Link from 'next/link';
import fetch from 'node-fetch';
import Notification from '../../components/Notification';
import Router, { withRouter } from 'next/router';
import { withIntl } from '../../lib/i18n';
import { fetchJson } from '../../lib/api';
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ConfirmSignaturePage extends Component {
  constructor(props) {
    super(props);
    const { status, token, preview } = this.props.router.query;
    this.state = { status: status || (preview === 'confirmed' ? 'signature_confirmed' : null), token: token || null };
    this.confirmSignature = this.confirmSignature.bind(this);
  }

  async confirmSignature() {
    const token = this.props.router.query.token || this.state.token;
    if (!token) {
      console.error('>>> no token found in query string, aborting');
      return;
    }
    console.log('>>> confirming signature with token', token, 'letter to sign', this.props.letter);
    await sleep(500);
    const apiCall = `${process.env.API_URL}/signatures/confirm`;
    const resAction = await fetch(apiCall, {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    });
    const resActionJSON = await resAction.json();
    if (Router.router && this.props.letter) {
      Router.replace(`/${this.props.letter.slug}/confirm_signature?status=signature_confirmed`);
    }
    this.setState({ status: 'signature_confirmed' });
  }

  componentDidMount() {
    this.confirmSignature();
  }

  render() {
    const { letter, t } = this.props;
    const { status } = this.state;
    const token = this.state.token;
    if (!letter) {
      return (
        <div>
          <Notification title={t('error.letter.notfound')} />
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto w-full pt-4">
        <div className="px-4">
          {status === 'signature_confirmed' && (
            <>
              <Notification icon="signed" title={t('notification.signed')} message={t('notification.signed.info')} />
              <div className="text-center mt--4 mb-4 text-lg">
                <a href={`/${letter.slug}`} className="underline">
                  {letter.title}
                </a>
              </div>
              <p className="text-center text-sm">
                Looking to modify your signature?{' '}
                <a href={`/${letter.slug}?token=${token}`} className="underline">
                  Click here
                </a>
                .
              </p>
            </>
          )}
          {!status && (
            <Notification
              title={`${t('notification.signing')} ${letter.title}`}
              message={t('notification.pleasewait')}
            />
          )}
        </div>
      </div>
    );
  }
}

export async function getServerSideProps({ params, req }) {
  const apiCall = `${process.env.API_URL}/letters/${params.slug}`;
  console.log('>>> apiCall', apiCall);
  const { data: letter, error } = await fetchJson(apiCall);
  if (error) {
    return { props: { error } };
  }

  return { props: { letter } };
}

export default withIntl(withRouter(ConfirmSignaturePage));
