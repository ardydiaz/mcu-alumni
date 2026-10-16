import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { campaignIcon } from '../../components/ui/campaignIcons.js';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';
import { useReveal } from '../../hooks/useReveal.js';
import '../../styles/give.css';

const PRESETS = [500, 1000, 5000, 10000];
const CURRENCIES = [
  { value: 'PHP', symbol: '₱' },
  { value: 'USD', symbol: '$' },
];
const STEPS = [
  { icon: 'heart', title: 'Choose a campaign', text: 'Pick the cause closest to your heart.' },
  { icon: 'file', title: 'Submit your pledge', text: 'Tell us how much and how to reach you.' },
  { icon: 'building', title: 'Transfer to MCU', text: 'Deposit to BPI or PNB. We confirm it for you.' },
];
const REASONS = [
  { icon: 'check', title: '100% to your chosen cause', text: 'Your pledge goes to the campaign you select.' },
  { icon: 'file', title: 'Published every month', text: 'Donations appear in our transparency reports.' },
  { icon: 'compass', title: 'Give from anywhere', text: 'Local (PHP) and international (USD) options.' },
];

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/-/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className={`give-copy ${copied ? 'is-copied' : ''}`} onClick={copy} aria-label={`Copy account number ${value}`}>
      <Icon name={copied ? 'check' : 'copy'} size={15} />
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function StepTitle({ n, children }) {
  return (
    <legend className="give-step">
      <span className="give-step__num" aria-hidden="true">{n}</span>
      {children}
    </legend>
  );
}

// `initial` pre-fills fields (e.g. from the Alumni Portal account).
export function DonationForm({ campaigns, courses, initial }) {
  const [params] = useSearchParams();
  const { values, field, setValue, status, onSubmit } = useForm('donation', {
    firstName: '', lastName: '', email: '', phone: '',
    course: '', country: 'Philippines', city: '',
    amount: '', currency: 'PHP', campaignId: '', message: '',
    ...initial,
  });
  const symbol = CURRENCIES.find((c) => c.value === values.currency)?.symbol || '₱';
  const amountField = field('amount');

  // Links like /give?campaign=scholarship preselect a campaign by its slug.
  useEffect(() => {
    const preset = campaigns.find((c) => c.slug === params.get('campaign'));
    if (preset) setValue('campaignId', String(preset.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, campaigns]);

  return (
    <form onSubmit={onSubmit} className="form give-form" noValidate>
      <fieldset>
        <StepTitle n={1}>Choose a campaign</StepTitle>
        <div className="give-campaigns">
          {campaigns.map((c) => {
            const selected = values.campaignId === String(c.id);
            return (
              <label key={c.id} className={`give-campaign ${selected ? 'is-selected' : ''}`}>
                <input type="radio" name="campaignId" value={c.id} checked={selected} onChange={field('campaignId').onChange} />
                <span className="give-campaign__icon" aria-hidden="true"><Icon name={campaignIcon(c.slug)} size={20} /></span>
                <span className="give-campaign__text">
                  <strong>{c.title}</strong>
                  <span>{c.description}</span>
                </span>
                <span className="give-campaign__check" aria-hidden="true"><Icon name="check" size={14} /></span>
              </label>
            );
          })}
        </div>
        {field('campaignId').error && <small className="field__error">{field('campaignId').error}</small>}
      </fieldset>

      <fieldset>
        <StepTitle n={2}>Pledge amount</StepTitle>
        <div className="give-amount">
          <div className="give-currency" role="group" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={values.currency === c.value ? 'is-active' : ''}
                aria-pressed={values.currency === c.value}
                onClick={() => setValue('currency', c.value)}
              >
                {c.value}
              </button>
            ))}
          </div>
          <label className={`give-amount__input ${amountField.error ? 'has-error' : ''}`}>
            <span className="sr-only">Amount</span>
            <span className="give-amount__symbol" aria-hidden="true">{symbol}</span>
            <input type="number" min="1" inputMode="decimal" placeholder="0" name="amount" value={values.amount} onChange={amountField.onChange} aria-invalid={Boolean(amountField.error)} required />
          </label>
        </div>
        <div className="give-presets">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`give-preset ${Number(values.amount) === p ? 'is-selected' : ''}`} onClick={() => setValue('amount', String(p))}>
              {symbol}{p.toLocaleString()}
            </button>
          ))}
        </div>
        {amountField.error && <small className="field__error">{amountField.error}</small>}
      </fieldset>

      <fieldset>
        <StepTitle n={3}>Your details</StepTitle>
        <div className="form-grid">
          <Field label="First name" autoComplete="given-name" required {...field('firstName')} />
          <Field label="Last name" autoComplete="family-name" required {...field('lastName')} />
          <Field label="Email" type="email" autoComplete="email" required {...field('email')} />
          <Field label="Telephone / Cellphone" type="tel" autoComplete="tel" required {...field('phone')} />
          <Field label="Course / Department" as="select" options={courses} required className="span-2" {...field('course')} />
          <Field label="Country" autoComplete="country-name" required {...field('country')} />
          <Field label="City" autoComplete="address-level2" required {...field('city')} />
        </div>
        <Field label="Message (optional)" as="textarea" {...field('message')} />
      </fieldset>

      <FormStatus status={status} />
      {status.state === 'success' && (
        <p className="muted">Please complete your gift through any of the bank accounts listed on this page. Our team will reach out to confirm your donation.</p>
      )}
      <SubmitButton status={status} className="btn-lg btn-block">
        <Icon name="heart" size={18} /> Submit my pledge
      </SubmitButton>
      <p className="give-form__note">
        <Icon name="shield" size={14} /> Your details are only used to acknowledge and confirm your gift.
      </p>
    </form>
  );
}

export function BankDetails({ banks }) {
  return (
    <div className="give-bank" id="bank-details">
      <div className="give-bank__head">
        <Icon name="building" size={20} />
        <div>
          <h2>Bank details</h2>
          <p>Deposit or transfer your donation to any of these accounts.</p>
        </div>
      </div>
      {banks.map((b) => (
        <div key={b.bank} className="give-bank__bank">
          <div className="give-bank__brand">
            <img src={b.logo} alt="" />
            <div>
              <strong>{b.bank}</strong>
              <span>{b.accountName}</span>
            </div>
          </div>
          {b.accounts.map((a) => (
            <div key={a.number} className="give-bank__row">
              <div>
                <small>{a.type}</small>
                <code>{a.number}</code>
                {a.swift && <small className="give-bank__swift">SWIFT: <code>{a.swift}</code></small>}
              </div>
              <CopyButton value={a.number} />
            </div>
          ))}
        </div>
      ))}
      <a href="tel:+639171046520" className="give-bank__help">
        <span className="give-bank__help-icon" aria-hidden="true"><Icon name="phone" size={18} /></span>
        <span>
          <small>Questions about giving?</small>
          <strong>(+63) 917 104 6520</strong>
        </span>
      </a>
    </div>
  );
}

export default function Give() {
  const give = useContent('give');
  const campaigns = useContent('campaigns');
  const courses = useContent('courses');
  useReveal([give.data, campaigns.data, courses.data]);

  return (
    <div className="give">
      <section className="give-hero" style={{ '--hero-image': 'url("/images/give-banner.webp")' }}>
        <div className="container">
          <div className="give-hero__panel">
            <span className="give-hero__eyebrow">Give</span>
            <h1>Your generosity shapes the future of MCU</h1>
            <p>Support scholars, facilities, athletics and research. Every gift makes a difference.</p>
            <div className="give-hero__actions">
              <a href="#donate" className="btn btn-gold btn-lg">Make a pledge <Icon name="arrowRight" size={18} /></a>
              <a href="#bank-details" className="btn btn-outline-light btn-lg">Bank details</a>
            </div>
          </div>
        </div>
      </section>

      {/* How giving works: overlaps the bottom of the banner */}
      <div className="container">
        <ol className="give-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="give-steps__item">
              <span className="give-steps__icon" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
              <div>
                <small>Step {i + 1}</small>
                <strong>{s.title}</strong>
                <span className='desc-give'>{s.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <section className="give-section">
        <AsyncContent state={give} skeleton={1}>
          {(data) => (
            <div className="container give-why">
              <div className="give-why__text" data-reveal>
                <span className="give-eyebrow">Why give</span>
                <h2>A tradition of excellence since 1904</h2>
                <p className="give-why__intro">{data.intro}</p>
                <ul className="give-reasons">
                  {REASONS.map((r, i) => (
                    <li key={r.title} data-reveal style={{ '--delay': `${i * 90}ms` }}>
                      <span className="give-reasons__icon" aria-hidden="true"><Icon name={r.icon} size={18} /></span>
                      <div>
                        <strong>{r.title}</strong>
                        <span>{r.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="give-why__media" data-reveal style={{ '--delay': '120ms' }}>
                <img src={data.image} alt="MCU classroom" loading="lazy" />
                <div className="give-why__badge">
                  <strong>1904</strong>
                  <span>Serving Centralinos for over a century</span>
                </div>
              </div>
            </div>
          )}
        </AsyncContent>
      </section>

      <section className="give-section give-section--tinted" id="donate">
        <div className="container">
          <div className="give-heading" data-reveal>
            <span className="give-eyebrow">Make a pledge</span>
            <h2>Three quick steps to give</h2>
            <p>Tell us about your gift so we can acknowledge and allocate it properly.</p>
          </div>
          <div className="give-layout2">
            <div className="give-card" data-reveal>
              {campaigns.data && courses.data ? (
                <DonationForm campaigns={campaigns.data} courses={courses.data} />
              ) : (
                <AsyncContent state={campaigns.error ? campaigns : courses} skeleton={1}>{() => null}</AsyncContent>
              )}
            </div>
            <aside className="give-aside2" data-reveal style={{ '--delay': '120ms' }}>
              <AsyncContent state={give} skeleton={2}>{(data) => <BankDetails banks={data.banks} />}</AsyncContent>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
