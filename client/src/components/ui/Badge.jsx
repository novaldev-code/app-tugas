export default function Badge({ tone = 'default', className = '', children }) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}
