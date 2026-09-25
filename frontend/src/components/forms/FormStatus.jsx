import Icon from '../ui/Icon.jsx';

export default function FormStatus({ status }) {
  if (status.state === 'success') {
    return (
      <div className="alert alert--success" role="status">
        <Icon name="check" size={18} /> {status.message}
      </div>
    );
  }
  if (status.state === 'error') {
    return <div className="alert alert--error" role="alert">{status.message}</div>;
  }
  return null;
}
