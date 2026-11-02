export default function Field({
  label,
  hint,
  error,
  children,
  className = '',
  required = false,
  id,
}) {
  return (
    <div className={`field-group ${className}`.trim()}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
