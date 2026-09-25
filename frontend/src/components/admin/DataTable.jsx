// columns: [{ key, label, render?(row), className? }]
export default function DataTable({ columns, rows, loading, onRowClick, emptyMessage = 'No records found.', rowKey = 'id' }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.className}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={`sk-${i}`} className="is-skeleton">
                  {columns.map((c) => (
                    <td key={c.key}><span className="skeleton-line" /></td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  className={onRowClick ? 'is-clickable' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(row)) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.className} data-label={c.label}>
                      {c.render ? c.render(row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && !rows.length && <p className="table-empty">{emptyMessage}</p>}
      {loading && rows.length > 0 && <div className="table-loading" aria-hidden="true" />}
    </div>
  );
}
