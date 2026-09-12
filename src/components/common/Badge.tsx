import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-[#10B981] border border-emerald-200',
    warning: 'bg-amber-50 text-[#F59E0B] border border-amber-200',
    danger: 'bg-rose-50 text-[#EF4444] border border-rose-200',
    info: 'bg-blue-50 text-[#2563EB] border border-blue-200',
    neutral: 'bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]',
    orange: 'bg-[#FFF1EB] text-[#F25C05] border border-orange-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full uppercase tracking-wider font-semibold whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
