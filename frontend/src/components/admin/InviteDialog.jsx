import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Badge from './Badge.jsx';
import { formatDate } from './format.js';
import { useToast } from './Toast.jsx';
import Icon from '../ui/Icon.jsx';
import { adminApi } from '../../api/admin.js';

// Portal invitations: graduates in the alumni database get an email link to activate their portal account.
// Status of one profile, mirrored from backend/src/modules/portal/portal.invite.js
export function inviteStatus(p) {
  if (p.alumniAccountId) return 'claimed';
  if (!p.email) return 'no_email';
  if (!p.invitedAt) return 'not_invited';
  return p.inviteExpiresAt && new Date(p.inviteExpiresAt) < new Date() ? 'expired' : 'invited';
}

export const INVITE_STATUS = {
  claimed: { label: 'Activated', tone: 'success' },
  invited: { label: 'Invited', tone: 'info' },
  expired: { label: 'Invite expired', tone: 'warning' },
  not_invited: { label: 'Not invited', tone: 'neutral' },
  no_email: { label: 'No email', tone: 'danger' },
};

export function InviteBadge({ profile }) {
  const s = inviteStatus(profile);
  const title = s === 'invited' || s === 'expired' ? `Invited ${formatDate(profile.invitedAt)} · link ${s === 'expired' ? 'expired' : 'valid until'} ${formatDate(profile.inviteExpiresAt)}` : undefined;
  return (
    <span title={title}>
      <Badge value={s} tone={INVITE_STATUS[s].tone} label={INVITE_STATUS[s].label} />
    </span>
  );
}

const ROWS = [
  ['claimed', 'Activated', 'Already using the portal'],
  ['invited', 'Invited, not yet activated', 'Link still valid'],
  ['expired', 'Link expired', 'Will get a new link'],
  ['not_invited', 'Not invited yet', 'Will get a link'],
  ['registered', 'Registered on their own', 'Verify them in Portal accounts'],
  ['no_email', 'No usable email', "Can't be invited; they can register themselves"],
];

/**
 * scope: { importBatchId } | { yearGraduated }. Shows who would be invited, then sends.
 */
export default function InviteDialog({ open, scope, title, onClose, onSent }) {
  const notify = useToast();
  const [summary, setSummary] = useState(null);
  const [resend, setResend] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const key = JSON.stringify(scope || {});

  useEffect(() => {
    if (!open) return;
    setSummary(null);
    setResult(null);
    setResend(false);
    adminApi.fetch('/profiles/invitations/summary', scope).then(setSummary).catch((err) => notify(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const count = summary ? summary.not_invited + summary.expired + (resend ? summary.invited : 0) : 0;

  const send = async () => {
    setBusy(true);
    try {
      const res = await adminApi.send('/profiles/invitations', 'POST', { ...scope, resend });
      setResult(res.data);
      notify(res.message, res.data.failed ? 'error' : undefined);
      onSent?.();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title || 'Invite to the Alumni Portal'}
      subtitle="Each graduate gets a personal link by email to set a password. Their account is active right away, already linked to their record. Links expire after 14 days."
      onClose={() => !busy && onClose()}
      footer={
        result ? (
          <>
            <span className="modal__foot-spacer" />
            <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-sm admin-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <span className="modal__foot-spacer" />
            <button type="button" className="btn btn-sm btn-primary" onClick={send} disabled={busy || !count}>
              <Icon name="mail" size={14} /> {busy ? `Sending ${count.toLocaleString()}…` : `Send ${count.toLocaleString()} invitation${count === 1 ? '' : 's'}`}
            </button>
          </>
        )
      }
    >
      {!summary && <p className="muted">Counting…</p>}

      {summary && !result && (
        <>
          <ul className="iv-rows">
            {ROWS.map(([k, label, hint]) => (
              <li key={k} className={summary[k] ? '' : 'is-zero'}>
                <strong>{summary[k].toLocaleString()}</strong>
                <span>{label}<small>{hint}</small></span>
              </li>
            ))}
          </ul>
          {summary.invited > 0 && (
            <label className="iv-resend">
              <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} />
              <span>Also send a reminder to the {summary.invited.toLocaleString()} invited who haven't activated yet (they get a new link)</span>
            </label>
          )}
          <p className="muted iv-note">Graduates who share an email address with someone else are skipped, since we can't tell whose it is.</p>
        </>
      )}

      {result && (
        <div className="iv-result">
          <span className="iv-result__icon"><Icon name={result.failed ? 'alert' : 'check'} size={24} /></span>
          <div>
            <strong>{result.sent.toLocaleString()} invitation{result.sent === 1 ? '' : 's'} sent</strong>
            <ul>
              {result.failed > 0 && <li className="is-error">{result.failed} could not be delivered: {result.failures[0]?.error}</li>}
              {result.skipped.shared_email > 0 && <li>{result.skipped.shared_email} skipped: email shared with another graduate</li>}
              {result.skipped.already_invited > 0 && <li>{result.skipped.already_invited} skipped: already invited</li>}
              {result.skipped.registered > 0 && <li>{result.skipped.registered} skipped: registered on their own</li>}
              {result.skipped.no_email > 0 && <li>{result.skipped.no_email} skipped: no email</li>}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
