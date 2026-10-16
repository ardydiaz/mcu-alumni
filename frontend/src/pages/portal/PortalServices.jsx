import { Link, useOutletContext } from 'react-router-dom';
import AsyncContent from '../../components/ui/AsyncContent.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useContent } from '../../hooks/useContent.js';
import { UpdateForm } from '../public/ContactUpdate.jsx';
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

const contactPrefill = (a) => ({
  ...nameParts(a.fullName),
  email: a.email,
  phone: a.phone,
  studentNumber: a.studentNumber,
  yearGraduated: String(a.yearGraduated),
});

const usePortalAccount = () => useOutletContext().account;

export function PortalUpdateInfo() {
  const account = usePortalAccount();
  const courses = useContent('courses');
  return (
    <>
      <PortalPageHead
        icon="users"
        eyebrow="Alumni information"
        title="Update my information"
        text="Keep your address, work and contact details current so you never miss a reunion or alumni benefit."
      />
      <section className="portal-card">
        <AsyncContent state={courses} skeleton={1}>
          {(data) => <UpdateForm courses={data} initial={contactPrefill(account)} />}
        </AsyncContent>
      </section>
    </>
  );
}

const ID_STEPS = [
  { title: 'Request', text: 'Confirm your details below and tick "request an MCU Alumni ID".' },
  { title: 'We contact you', text: 'The Alumni Relations Office tells you the requirements and release schedule.' },
  { title: 'Enjoy perks', text: 'Present your Alumni ID at our merchant partners for discounts.' },
];

export function PortalAlumniId() {
  const account = usePortalAccount();
  const courses = useContent('courses');
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
      <section className="portal-card">
        <AsyncContent state={courses} skeleton={1}>
          {(data) => <UpdateForm courses={data} initial={{ ...contactPrefill(account), requestAlumniId: true }} />}
        </AsyncContent>
      </section>
    </>
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
