import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section not-found">
      <div className="container narrow center">
        <span className="not-found__code">404</span>
        <h1>Page not found</h1>
        <p className="muted">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn btn-primary btn-lg">Back to home</Link>
      </div>
    </section>
  );
}
