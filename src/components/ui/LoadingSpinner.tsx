export function LoadingSpinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className="border-3 border-beige-200 border-t-sage-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-sm text-charcoal-400 animate-pulse-soft">{label}</p>}
    </div>
  );
}
