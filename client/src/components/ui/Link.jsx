export default function Link({ className = '', children, ...props }) {
  return (
    <a className={`link ${className}`.trim()} {...props}>
      {children}
    </a>
  );
}
