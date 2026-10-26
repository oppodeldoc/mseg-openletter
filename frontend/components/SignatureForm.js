import React, { Component } from 'react';
import { withIntl } from '../lib/i18n';
import { ROLES } from '../constants/roles';

const fieldClass =
  'border-dotted border-gray-400 border p-2 rounded-lg w-full bg-white dark:bg-black dark:text-gray-50 dark:border-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 dark:focus:ring-white';
const labelClass = 'block text-sm text-gray-700 dark:text-gray-300 mb-1';
const checkboxClass =
  'h-5 w-5 mt-0.5 rounded border-gray-400 text-gray-900 focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 dark:focus:ring-white';

const Field = ({ label, name, children }) => (
  <div className="w-full py-1">
    <label htmlFor={name} className={labelClass}>
      {label}
    </label>
    {children}
  </div>
);

class SignatureForm extends Component {
  constructor(props) {
    super(props);
    const existing = this.props.signature || {};
    this.state = {
      loading: false,
      form: {
        name: existing.name || null,
        occupation: ROLES.includes(existing.occupation) ? existing.occupation : '',
        city: existing.city || null,
        organization: existing.organization || null,
        email: null,
        share_email: false,
        show_name: typeof existing.show_name === 'boolean' ? existing.show_name : true,
        id: existing.id,
        token: existing.token,
      },
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
  }

  async handleSubmit(event) {
    this.setState({ loading: true });
    event.preventDefault();

    await this.props.onSubmit({ ...this.state.form });

    // just in case
    setTimeout(() => {
      this.setState({ loading: false });
    }, 2000);
    return false;
  }

  updatingSignature = this.props.signature && this.props.signature.id;

  render() {
    const { error, t, letter } = this.props;
    const { form } = this.state;
    const existing = this.props.signature || {};

    return (
      <form onSubmit={this.handleSubmit}>
        <div className="flex-wrap">
          <Field label={t('sign.name')} name="name">
            <input
              className={`font-[SignPainter] text-3xl pt-2 px-2 pb-1 ${fieldClass}`}
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              maxLength={128}
              required
              defaultValue={existing.name}
              onChange={(e) => this.handleChange('name', e.target.value)}
            />
          </Field>

          <Field label={t('sign.role')} name="occupation">
            <select
              id="occupation"
              name="occupation"
              className={fieldClass}
              required
              value={form.occupation}
              onChange={(e) => this.handleChange('occupation', e.target.value)}
            >
              <option value="" disabled>
                {t('sign.role.placeholder')}
              </option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex w-full gap-2">
            <div className="w-1/2">
              <Field label={t('sign.organization')} name="organization">
                <input
                  className={fieldClass}
                  type="text"
                  id="organization"
                  name="organization"
                  autoComplete="organization"
                  maxLength={64}
                  defaultValue={existing.organization}
                  onChange={(e) => this.handleChange('organization', e.target.value)}
                />
              </Field>
            </div>
            <div className="w-1/2">
              <Field label={t('sign.city')} name="city">
                <input
                  className={fieldClass}
                  type="text"
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  maxLength={64}
                  defaultValue={existing.city}
                  onChange={(e) => this.handleChange('city', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {!this.updatingSignature && (
            <Field label={t('sign.email')} name="email">
              <input
                className={fieldClass}
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                onChange={(e) => this.handleChange('email', e.target.value)}
              />
            </Field>
          )}

          <div className="my-2">
            <label htmlFor="show_name" className="flex items-start gap-2 cursor-pointer dark:text-gray-300">
              <input
                type="checkbox"
                id="show_name"
                name="show_name"
                className={checkboxClass}
                checked={form.show_name}
                onChange={(e) => this.handleChange('show_name', e.target.checked)}
              />
              <span>
                {t('sign.show_name')}
                <span className="block text-xs text-gray-500 dark:text-gray-400">{t('sign.show_name.hint')}</span>
              </span>
            </label>
          </div>

          {!this.updatingSignature && letter.user_id && (
            <div className="my-2">
              <label htmlFor="share_email" className="flex items-start gap-2 cursor-pointer dark:text-gray-300">
                <input
                  type="checkbox"
                  id="share_email"
                  name="share_email"
                  className={checkboxClass}
                  onChange={(e) => this.handleChange('share_email', e.target.checked)}
                />
                <span>{t('sign.share_email')}</span>
              </label>
            </div>
          )}
        </div>
        <div className="mt-4 mb-6">
          <button
            type="submit"
            className="text-white text-base font-sans border-white bg-gray-900 p-3 rounded-lg w-full disabled:bg-gray-500 dark:bg-black dark:text-white dark:border-white border-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white"
            disabled={this.state.loading}
          >
            {this.props.signature ? t('sign.update') : t('sign.button')}
          </button>
        </div>
        {error && (
          <div role="alert" className="text-red-700 dark:text-red-400 font-bold text-center m-4">
            {error.message}
          </div>
        )}
      </form>
    );
  }
}

export default withIntl(SignatureForm);
