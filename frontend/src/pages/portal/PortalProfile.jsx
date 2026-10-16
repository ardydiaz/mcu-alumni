import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import ProfileEditor from '../../components/profile/ProfileEditor.jsx';
import { useContent } from '../../hooks/useContent.js';
import { portalApi } from '../../api/portal.js';
import { PortalPageHead } from './PortalLayout.jsx';
import '../../styles/profile.css';

// "My Profile" in the Alumni Portal (Step 4): the alumnus's master record, sections A, B and C.
export default function PortalProfile() {
  const [state, setState] = useState({ profile: null, loading: true, error: null });
  const options = useContent('form-options');

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
      <ProfileEditor
        profile={state.profile}
        mode="alumni"
        api={portalApi}
        onChange={(profile) => setState((s) => ({ ...s, profile }))}
        choices={{ jobCategories: options.data?.jobCategories || [] }}
      />
    </>
  );
}
