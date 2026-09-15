import type { ReactNode } from 'react';

type BadgeVariant = 'good' | 'warn' | 'critical' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  good: 'badge-good',
  warn: 'badge-warn',
  critical: 'badge-critical',
  neutral: 'badge-neutral',
};

const dotColors: Record<BadgeVariant, string> = {
  good: 'bg-sage-500',
  warn: 'bg-amber-500',
  critical: 'bg-terracotta-500',
  neutral: 'bg-charcoal-400',
};

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  if (score >= 85) return <Badge variant="good">Good</Badge>;
  if (score >= 60) return <Badge variant="warn">Needs Attention</Badge>;
  return <Badge variant="critical">Critical</Badge>;
}
