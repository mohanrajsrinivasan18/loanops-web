import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: ReactNode;
}

function Badge({ children, variant = 'default', size = 'md', dot = false, icon }: BadgeProps) {
  const variants: Record<string, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    purple: 'badge-purple',
    neutral: 'badge-neutral',
    default: 'badge-neutral',
  };

  const sizes: Record<string, string> = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  const dotColors: Record<string, string> = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
    purple: 'bg-secondary-500',
    neutral: 'bg-neutral-400',
    default: 'bg-neutral-400',
  };

  return (
    <span className={`${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {icon}
      {children}
    </span>
  );
}

export { Badge };
export default Badge;
