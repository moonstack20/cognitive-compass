import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
  return (
    <div className={`card ${hover ? 'hover:shadow-md' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'sage' | 'terracotta' | 'charcoal';
  subtitle?: string;
}

export function StatCard({ label, value, icon, accent = 'sage', subtitle }: StatCardProps) {
  const accentColors = {
    sage: 'bg-sage-100 text-sage-700',
    terracotta: 'bg-terracotta-100 text-terracotta-700',
    charcoal: 'bg-beige-200 text-charcoal-600',
  };
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-charcoal-400 font-medium">{label}</span>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold text-charcoal-700 font-serif">{value}</div>
        {subtitle && <div className="text-xs text-charcoal-400 mt-1">{subtitle}</div>}
      </div>
    </Card>
  );
}
