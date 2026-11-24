import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import ProfileEditor from '../../components/profile/ProfileEditor.jsx';
import { useContent } from '../../hooks/useContent.js';
import { portalApi } from '../../api/portal.js';
import { usePortalAuth } from '../../context/PortalAuthContext.jsx';
import { PortalPageHead } from './PortalLayout.jsx';
import '../../styles/profile.css';

// Step 3: shown until the alumnus reviews their profile for the first time (any change, the Graduate Tracer,
// or "My information is correct"). The text depends on whether a record was found for them.
function ReviewBanner({ profile, onConfirmed }) {
  const [state, setState] = useState({ busy: false, error: '' });
  const found = profile.source !== 'portal'; // imported from the Registrar or encoded by EAO
  const { percent } = profile.completeness || {};

  const confirm = async () => {
    setState({ busy: true, error: '' });
    try {
      const res = await portalApi.confirmProfile();
      onConfirmed(res.data);
    } catch (err) {
      setState({ busy: false, error: err.message || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <section className="portal-review pf-review" aria-labelledby="pf-review-title">
      <span className="portal-review__icon" aria-hidden="true"><Icon name={found ? 'check' : 'users'} size={22} /></span>
      <div className="pf-review__body">
        <strong id="pf-review-title">{found ? 'We found your alumni record' : 'Welcome! Let’s complete your alumni profile'}</strong>
        <p>
          {found
            ? 'Your information from the MCU alumni records is shown below. Please review it, update anything missing or outdated, then confirm.'
            : 'We created your alumni profile from your registration. Please fill in the rest of your information below, then confirm.'}
          {percent != null && percent < 100 && ` Your profile is ${percent}% complete.`}
        </p>
        {state.error && <p className="pf-review__error" role="alert">{state.error}</p>}
      </div>
      <button type="button" className="btn btn-primary btn-sm pf-review__btn" onClick={confirm} disabled={state.busy}>
        <Icon name="check" size={14} /> {state.busy ? 'Saving…' : 'My information is correct'}
      </button>
    </section>
  );
}

// "My Profile" in the Alumni Portal (Step 4): the alumnus's master record, sections A, B and C.
export default function PortalProfile() {
  const [state, setState] = useState({ profile: null, loading: true, error: null });
  const options = useContent('form-options');
  const { refresh } = usePortalAuth();

  useEffect(() => {
    let active = true;
    portalApi
      .profile()
      .then((profile) => active && setState({ profile, loading: false, error: null }))
      .catch((error) => active && setState({ profile: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, []);

  const head = (
    <PortalPageHead
      icon="users"
      eyebrow="My profile"
      title="Your alumni profile"
      text="Keep your details current. Your verified record is managed by the Alumni Relations Office; everything else you can update here."
    />
  );

  if (state.loading) return <>{head}<div className="skeleton" style={{ height: 260, borderRadius: 24 }} /></>;

  if (state.error) {
    const pending = state.error.fields?.reason === 'not_verified';
    return (
      <>
        {head}
        <section className="portal-review">
          <span className="portal-review__icon" aria-hidden="true"><Icon name={pending ? 'clock' : 'close'} size={22} /></span>
          <div>
            <strong>{pending ? 'Your profile opens after verification' : "We couldn't load your profile"}</strong>
            <p>{pending ? 'The Alumni Relations Office is confirming your record. Once verified, your profile and Alumni Number will appear here.' : state.error.message}</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {head}
      {!state.profile.alumniUpdatedAt && (
        <ReviewBanner
          profile={state.profile}
          onConfirmed={(profile) => {
            setState((s) => ({ ...s, profile }));
            refresh(); // account.profileReviewed -> true, so the next login opens the dashboard
          }}
        />
      )}
      <ProfileEditor
        profile={state.profile}
        mode="alumni"
        api={portalApi}
        onChange={(profile) => {
          // A new photo: refresh the account so the sidebar and header avatar update right away.
          if (profile.photo !== state.profile?.photo) refresh();
          setState((s) => ({ ...s, profile }));
        }}
        choices={{ jobCategories: options.data?.jobCategories || [], industries: options.data?.industries || [] }}
      />
    </>
  );
}
