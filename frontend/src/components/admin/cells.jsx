import { assetUrl } from '../../api/client.js';

// Table cell with an optional thumbnail, a primary line and a secondary line.
export function TitleCell({ image, title, subtitle, round }) {
  return (
    <div className="title-cell">
      {image !== undefined && (
        <span className={`title-cell__thumb ${round ? 'is-round' : ''}`}>
          {image ? <img src={assetUrl(image)} alt="" loading="lazy" /> : <span aria-hidden="true">{String(title || '?')[0]}</span>}
        </span>
      )}
      <span className="title-cell__text">
        <strong>{title || '—'}</strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </div>
  );
}

export const Truncate = ({ text, max = 80 }) =>
  !text ? '—' : text.length > max ? <span title={text}>{text.slice(0, max).trimEnd()}…</span> : text;
