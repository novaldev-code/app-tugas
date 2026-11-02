export default function Panel({ className = '', children, ...props }) {
  return (
    <section className={`panel ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

export function PanelHeader({ className = '', children, ...props }) {
  return (
    <header className={`panel-header ${className}`.trim()} {...props}>
      {children}
    </header>
  );
}

export function PanelBody({ className = '', children, ...props }) {
  return (
    <div className={`panel-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
