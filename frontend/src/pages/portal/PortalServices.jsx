import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { portalApi } from '../../api/portal.js';
import { DonationForm, BankDetails } from '../public/Give.jsx';
import { PartnerGrid } from '../public/MerchantPartners.jsx';
import { PortalPageHead } from './PortalLayout.jsx';

// Alumni Portal pages that reuse the public forms inside the portal, pre-filled from the account.

// "Diaz, Ardy P." -> { lastName: "Diaz", firstName: "Ardy", middleName: "P." }
function nameParts(fullName = '') {
  const [lastName = '', given = ''] = fullName.split(',').map((s) => s.trim());
  const words = given.split(/\s+/).filter(Boolean);
  const isInitial = (w) => /^[A-Za-z]\.?$/.test(w);
  const middle = words.length > 1 && isInitial(words[words.length - 1]) ? words.pop() : '';
  return { lastName, firstName: words.join(' '), middleName: middle };
}

const usePortalAccount = () => useOutletContext().account;

const ID_STEPS = [
  { title: 'Request', text: 'Check your details in My profile, then click "Request my Alumni ID".' },
  { title: 'We contact you', text: 'The Alumni Relations Office tells you the requirements and release schedule.' },
  { title: 'Enjoy perks', text: 'Present your Alumni ID at our merchant partners for discounts.' },
];

export function PortalAlumniId() {
  const account = usePortalAccount();
  const site = useContent('site');
  return (
    <>
      <PortalPageHead icon="id" eyebrow="MCU Alumni ID" title="Request your Alumni ID" text="Your official MCU Alumni ID unlocks discounts from our merchant partners." />
      <section className="portal-id">
        {site.data && <img src={site.data.alumniIdImage} alt="Sample MCU Alumni ID card" className="portal-id__img" />}
        <ol className="portal-id__steps">
          {ID_STEPS.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden="true">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <small>{s.text}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <AlumniIdRequest verified={account.status === 'verified'} />
    </>
  );
}

const ID_STATUS = {
  requested: { label: 'Requested', text: 'The Alumni Relations Office has your request and will contact you about the requirements.' },
  processing: { label: 'Being processed', text: 'Your Alumni ID is being prepared. We will tell you when and where to claim it.' },
  released: { label: 'Released', text: 'Your Alumni ID has been released. Present it at our merchant partners for discounts.' },
};

// One click: the request uses the details in the alumnus's profile (one request per graduate).
function AlumniIdRequest({ verified }) {
  const [state, setState] = useState({ loading: verified, request: null, busy: false, message: null });

  useEffect(() => {
    if (!verified) return;
    portalApi.alumniId().then((d) => setState((s) => ({ ...s, loading: false, request: d.request }))).catch(() => setState((s) => ({ ...s, loading: false })));
  }, [verified]);

  const request = async () => {
    setState((s) => ({ ...s, busy: true, message: null }));
    try {
      const res = await portalApi.requestAlumniId();
      setState((s) => ({ ...s, busy: false, request: res.data.request, message: { ok: true, text: res.message } }));
    } catch (err) {
      setState((s) => ({ ...s, busy: false, message: { ok: false, text: err.message, profile: err.fields?.reason === 'incomplete_profile' } }));
    }
  };

  if (!verified) {
    return (
      <section className="portal-card portal-idreq">
        <p className="muted">You can request your Alumni ID once the Alumni Relations Office verifies your account.</p>
      </section>
    );
  }
  if (state.loading) return <section className="portal-card portal-idreq"><span className="spinner spinner--dark" aria-hidden="true" /></section>;

  const current = state.request && ID_STATUS[state.request.status];
  return (
    <section className="portal-card portal-idreq">
      {current ? (
        <div className="portal-idreq__status">
          <span className={`portal-idreq__badge is-${state.request.status}`}><Icon name={state.request.status === 'released' ? 'check' : 'clock'} size={14} /> {current.label}</span>
          <p>{current.text}</p>
        </div>
      ) : (
        <div className="portal-idreq__status">
          <strong>Ready to request your Alumni ID?</strong>
          <p>We use the details in your alumni profile: your name, program, batch, contact number and address. Please check that they're current.</p>
        </div>
      )}
      <div className="portal-idreq__actions">
        {!current && (
          <button type="button" className="btn btn-gold btn-lg" onClick={request} disabled={state.busy}>
            {state.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="id" size={18} />} Request my Alumni ID
          </button>
        )}
        <Link to="/portal/profile" className="btn btn-outline">Review my profile</Link>
      </div>
      {state.message && <p className={`portal-idreq__msg ${state.message.ok ? 'is-ok' : 'is-error'}`} role="status">{state.message.text}</p>}
    </section>
  );
}

export function PortalPerks() {
  const merchants = useContent('merchant-partners');
  return (
    <>
      <PortalPageHead icon="tag" eyebrow="Alumni perks" title="Discounts for Centralinos" text="Present your MCU Alumni ID upon purchase. Terms and validity are set by each partner." />
      <div className="portal-perks">
        <AsyncContent state={merchants} skeleton={6}>{(data) => <PartnerGrid partners={data} />}</AsyncContent>
      </div>
      <p className="portal-hint">
        <Icon name="id" size={16} /> No Alumni ID yet? <Link to="/portal/alumni-id">Request yours</Link>.
      </p>
    </>
  );
}

export function PortalGive() {
  const account = usePortalAccount();
  const give = useContent('give');
  const campaigns = useContent('campaigns');
  const courses = useContent('courses');
  const { firstName, lastName } = nameParts(account.fullName);
  return (
    <>
      <PortalPageHead icon="heart" eyebrow="Give back" title="Support the next generation of Centralinos" text="Choose a campaign and submit your pledge, then transfer to any of our bank accounts." />
      <div className="portal-give">
        <div className="give-card">
          {campaigns.data && courses.data ? (
            <DonationForm campaigns={campaigns.data} courses={courses.data} initial={{ firstName, lastName, email: account.email, phone: account.phone }} />
          ) : (
            <AsyncContent state={campaigns.error ? campaigns : courses} skeleton={1}>{() => null}</AsyncContent>
          )}
        </div>
        <AsyncContent state={give} skeleton={2}>{(data) => <BankDetails banks={data.banks} />}</AsyncContent>
      </div>
    </>
  );
}
