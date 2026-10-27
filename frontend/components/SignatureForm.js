import React, { Component } from 'react';
import { withIntl } from '../lib/i18n';
import { ROLES } from '../constants/roles';

const fieldClass =
  'border border-gray-300 p-2 rounded w-full bg-white text-brand-ink focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/40';
const labelClass = 'block text-sm font-medium text-brand-ink mb-1';
const checkboxClass =
  'h-5 w-5 mt-0.5 rounded border-gray-400 accent-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/40';

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
              className={`text-lg ${fieldClass}`}
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
            <label htmlFor="show_name" className="flex items-start gap-2 cursor-pointer">
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
                <span className="block text-xs text-gray-600">{t('sign.show_name.hint')}</span>
              </span>
            </label>
          </div>

          {!this.updatingSignature && letter.user_id && (
            <div className="my-2">
              <label htmlFor="share_email" className="flex items-start gap-2 cursor-pointer">
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
            className="text-white text-base font-semibold bg-brand-green hover:bg-brand-green-dark p-3 rounded w-full disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
            disabled={this.state.loading}
          >
            {this.props.signature ? t('sign.update') : t('sign.button')}
          </button>
        </div>
        {error && (
          <div role="alert" className="text-red-700 font-bold text-center m-4">
            {error.message}
          </div>
        )}
      </form>
    );
  }
}

export default withIntl(SignatureForm);
