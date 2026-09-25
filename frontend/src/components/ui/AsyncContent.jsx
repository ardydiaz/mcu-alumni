// Renders a skeleton while content loads, an error message if it fails,
// and `children(data)` once it arrives.
export default function AsyncContent({ state, children, skeleton = 3 }) {
  if (state.loading) {
    return (
      <div className="grid grid-3" aria-busy="true" aria-label="Loading">
        {Array.from({ length: skeleton }, (_, i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="alert alert--error" role="alert">
        We couldn't load this section right now. Please refresh the page or try again later.
      </div>
    );
  }
  return children(state.data);
}
