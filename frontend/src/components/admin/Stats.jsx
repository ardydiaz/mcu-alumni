import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { formatNumber } from './format.js';

// A single headline number. Not a chart: one value doesn't need axes.
export function StatTile({ label, value, hint, icon, to }) {
  const content = (
    <>
      <div className="stat-tile__top">
        <span className="stat-tile__label">{label}</span>
        {icon && <span className="stat-tile__icon" aria-hidden="true"><Icon name={icon} size={18} /></span>}
      </div>
      <strong className="stat-tile__value">{value}</strong>
      {hint && <span className="stat-tile__hint">{hint}</span>}
    </>
  );
  return to ? <Link to={to} className="stat-tile stat-tile--link">{content}</Link> : <div className="stat-tile">{content}</div>;
}

/**
 * Horizontal bars for one series (magnitude by category), sorted largest first.
 * Single series -> one hue, no legend; every bar is direct-labeled with its value,
 * and each row has a hover/focus tooltip. The <table> fallback is visually hidden
 * for screen readers.
 */
export function BarList({ title, items, format = formatNumber, emptyMessage = 'No data yet.' }) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((i) => i.value), 0);
  const total = sorted.reduce((s, i) => s + i.value, 0);

  return (
    <figure className="bar-list">
      {title && <figcaption>{title}</figcaption>}
      {!sorted.length || max === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <>
          <ul aria-hidden="true">
            {sorted.map((item) => {
              const pct = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <li key={item.label} className="bar-list__row" tabIndex={0} data-tip={`${item.label}: ${format(item.value)} (${pct}%)`}>
                  <span className="bar-list__label">{item.label}</span>
                  <span className="bar-list__track">
                    <span className="bar-list__bar" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
                  </span>
                  <span className="bar-list__value">{format(item.value)}</span>
                </li>
              );
            })}
          </ul>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead><tr><th>Category</th><th>Value</th></tr></thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.label}><td>{item.label}</td><td>{format(item.value)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
