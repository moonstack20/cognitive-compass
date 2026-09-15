interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'sage' | 'terracotta' | 'amber' | 'charcoal';
}

export function ProgressBar({ value, max = 100, label, showValue = true, color = 'sage' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    sage: 'bg-sage-500',
    terracotta: 'bg-terracotta-500',
    amber: 'bg-amber-500',
    charcoal: 'bg-charcoal-500',
  };
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-charcoal-500 font-medium">{label}</span>
          {showValue && <span className="text-xs text-charcoal-400">{pct}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-beige-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[color]} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
