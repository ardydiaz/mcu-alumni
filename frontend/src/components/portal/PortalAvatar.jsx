import { useState } from 'react';
import { assetUrl } from '../../api/client.js';

// "Diaz, Ardy P." -> "AD"
export function initialsOf(fullName = '') {
  const [last = '', given = ''] = fullName.split(',').map((s) => s.trim());
  return `${given[0] || ''}${last[0] || ''}`.toUpperCase() || 'MCU';
}

// The alumnus's avatar everywhere in the site: their profile photo (uploaded in My profile), else initials.
// `className` sets the size and look (portal sidebar, header button, phone menu).
export default function PortalAvatar({ account, className = '' }) {
  const [broken, setBroken] = useState(null);
  const photo = account?.photo && broken !== account.photo ? assetUrl(account.photo) : null;
  return (
    <span className={`${className}${photo ? ' has-photo' : ''}`} aria-hidden="true">
      {photo ? <img src={photo} alt="" onError={() => setBroken(account.photo)} /> : <b>{initialsOf(account?.fullName)}</b>}
    </span>
  );
}
