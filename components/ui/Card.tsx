import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  hoverable?: boolean;
  variant?: 'default' | 'glass' | 'premium' | 'flat';
  padding?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  hoverable = false,
  variant = 'default',
  padding = 'md',
  animate = false,
}: CardProps) {
  const variantClasses = {
    default: 'card-modern',
    glass: 'card-glass',
    premium: 'card-premium',
    flat: 'bg-white rounded-2xl border border-neutral-100',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${
        animate ? 'animate-slide-up' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export { Card };
export default Card;
