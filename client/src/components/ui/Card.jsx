export default function Card({ className = '', children, ...props }) {
  return (
    <article className={`card ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <header className={`card-header ${className}`.trim()} {...props}>
      {children}
    </header>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={`card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <footer className={`card-footer ${className}`.trim()} {...props}>
      {children}
    </footer>
  );
}
