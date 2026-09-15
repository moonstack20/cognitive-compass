interface BarChartProps {
  data: Record<string, number>;
  targetData?: Record<string, number>;
  height?: number;
  color?: 'sage' | 'terracotta';
}

export function BarChart({ data, targetData, height = 160, color = 'sage' }: BarChartProps) {
  const entries = Object.entries(data);
  const maxVal = Math.max(...entries.map(([, v]) => v), ...(targetData ? Object.values(targetData) : [0]), 100);
  const barColor = color === 'sage' ? 'bg-sage-400' : 'bg-terracotta-400';
  const targetColor = color === 'sage' ? 'bg-sage-200' : 'bg-terracotta-200';

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {entries.map(([label, value]) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs font-medium text-charcoal-600">{value}%</div>
          <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 40 }}>
            {targetData && (
              <div
                className={`w-full ${targetColor} rounded-t-sm border-t-2 border-dashed border-charcoal-300`}
                style={{ height: `${(targetData[label] || 0 / maxVal) * (height - 40)}px` }}
                title={`Target: ${targetData[label] || 0}%`}
              />
            )}
            <div
              className={`w-full ${barColor} rounded-t-md transition-all duration-500`}
              style={{ height: `${(value / maxVal) * (height - 40)}px` }}
            />
          </div>
          <div className="text-[10px] text-charcoal-400 text-center leading-tight">{label}</div>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: Record<string, number>;
  size?: number;
}

export function DonutChart({ data, size = 140 }: DonutChartProps) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const colors = ['#7B9E5F', '#B06343', '#C9BCA0', '#97B67E', '#DB8E6B', '#5C554D'];
  let offset = 0;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E0D0" strokeWidth="14" />
        {entries.map(([label, value], i) => {
          const pct = value / total;
          const dash = pct * circumference;
          const circle = (
            <circle
              key={label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return circle;
        })}
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" className="fill-charcoal-600 font-serif font-bold" fontSize="20">
          {total}%
        </text>
      </svg>
      <div className="space-y-1.5">
        {entries.map(([label, value], i) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="text-charcoal-500">{label}</span>
            <span className="text-charcoal-400 font-medium">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
