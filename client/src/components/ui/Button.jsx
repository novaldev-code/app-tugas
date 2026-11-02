export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = ['button', `button-${variant}`, size === 'small' ? 'button-small' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={`${classes} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
