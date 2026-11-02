export default function Toast({ message, variant = 'success' }) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <div className={`toast toast-${variant}`}>{message}</div>
    </div>
  );
}
