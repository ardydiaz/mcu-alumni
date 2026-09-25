import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/forms/Field.jsx';
import FormStatus from '../../components/forms/FormStatus.jsx';
import SubmitButton from '../../components/forms/SubmitButton.jsx';
import { useContent } from '../../hooks/useContent.js';
import { useForm } from '../../hooks/useForm.js';

const PRESETS = [500, 1000, 5000, 10000];

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
    <button type="button" className="icon-btn" onClick={copy} aria-label={`Copy account number ${value}`}>
      <Icon name={copied ? 'check' : 'copy'} size={16} />
    </button>
  );
}

function DonationForm({ campaigns, courses }) {
  const [params] = useSearchParams();
  const { values, field, setValue, status, onSubmit } = useForm('donation', {
    firstName: '', lastName: '', email: '', phone: '',
    course: '', country: 'Philippines', city: '',
    amount: '', currency: 'PHP', campaignId: '', message: '',
  });

  // Links like /give?campaign=scholarship preselect a campaign by its slug.
  useEffect(() => {
    const preset = campaigns.find((c) => c.slug === params.get('campaign'));
    if (preset) setValue('campaignId', String(preset.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, campaigns]);

  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <fieldset>
        <legend>1. Choose a campaign</legend>
        <div className="choice-grid">
          {campaigns.map((c) => {
            const selected = values.campaignId === String(c.id);
            return (
              <label key={c.id} className={`choice ${selected ? 'is-selected' : ''}`}>
                <input type="radio" name="campaignId" value={c.id} checked={selected} onChange={field('campaignId').onChange} />
                <strong>{c.title}</strong>
                <span>{c.description}</span>
              </label>
            );
          })}
        </div>
        {field('campaignId').error && <small className="field__error">{field('campaignId').error}</small>}
      </fieldset>

      <fieldset>
        <legend>2. Pledge amount</legend>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`chip ${Number(values.amount) === p ? 'is-selected' : ''}`} onClick={() => setValue('amount', String(p))}>
              {values.currency === 'USD' ? '$' : '₱'}{p.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="form-grid form-grid--amount">
          <Field label="Currency" as="select" options={['PHP', 'USD']} required {...field('currency')} />
          <Field label="Amount" type="number" min="1" inputMode="decimal" required {...field('amount')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>3. Your details</legend>
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
    </form>
  );
}

export default function Give() {
  const give = useContent('give');
  const campaigns = useContent('campaigns');
  const courses = useContent('courses');

  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Your generosity shapes the future of MCU"
        subtitle="Support scholars, facilities, athletics and research. Every gift makes a difference."
        image="https://alumni.mcu.edu.ph/wp-content/uploads/2025/06/1-19-scaled-1-1200x800.webp"
      />

      <section className="section">
        <div className="container split">
          <AsyncContent state={give} skeleton={1}>
            {(data) => (
              <>
                <div>
                  <SectionHeading align="left" eyebrow="Why give" title="A tradition of excellence since 1904" text={data.intro} />
                  <ul className="checklist">
                    <li><Icon name="check" size={18} /> 100% of your pledge goes to the campaign you choose</li>
                    <li><Icon name="check" size={18} /> Donations are published in our monthly transparency reports</li>
                    <li><Icon name="check" size={18} /> Local and international (USD) giving options</li>
                  </ul>
                </div>
                <div className="split__media"><img src={data.image} alt="MCU students" loading="lazy" /></div>
              </>
            )}
          </AsyncContent>
        </div>
      </section>

      <section className="section section--tinted" id="donate">
        <div className="container give-layout">
          <div className="card card--padded">
            <h2 className="h3">Make a pledge</h2>
            <p className="muted">Tell us about your gift so we can acknowledge and allocate it properly.</p>
            {campaigns.data && courses.data ? (
              <DonationForm campaigns={campaigns.data} courses={courses.data} />
            ) : (
              <AsyncContent state={campaigns.error ? campaigns : courses} skeleton={1}>{() => null}</AsyncContent>
            )}
          </div>

          <aside className="give-aside">
            <h2 className="h3">Bank details</h2>
            <p className="muted">Deposit or transfer your donation to any of these accounts.</p>
            <AsyncContent state={give} skeleton={2}>
              {(data) =>
                data.banks.map((b) => (
                  <div key={b.bank} className="card bank">
                    <div className="bank__head">
                      <img src={b.logo} alt={b.bank} />
                      <div>
                        <strong>{b.bank}</strong>
                        <span>{b.accountName}</span>
                      </div>
                    </div>
                    {b.accounts.map((a) => (
                      <div key={a.number} className="bank__row">
                        <div>
                          <small>{a.type}</small>
                          <code>{a.number}</code>
                          {a.swift && <small>SWIFT: <code>{a.swift}</code></small>}
                        </div>
                        <CopyButton value={a.number} />
                      </div>
                    ))}
                  </div>
                ))
              }
            </AsyncContent>
            <div className="card card--note">
              <Icon name="phone" /> Questions? Call <a href="tel:+639171046520">(+63) 917 104 6520</a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
