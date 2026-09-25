import Icon from '../ui/Icon.jsx';

// Page numbers around the current page, e.g. 1 … 4 5 [6] 7 8 … 20
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i && p - sorted[i - 1] > 1 ? ['gap', p] : [p]));
}

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const { page, limit, total, totalPages } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="muted">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
      {totalPages > 1 && (
        <nav className="pagination__pages" aria-label="Pagination">
          <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <Icon name="arrowRight" size={16} className="flip" />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="pagination__gap">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`pagination__page ${p === page ? 'is-current' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className="icon-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
            <Icon name="arrowRight" size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
