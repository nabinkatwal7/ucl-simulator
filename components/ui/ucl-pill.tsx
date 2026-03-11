type Variant = 'default' | 'success' | 'warning' | 'danger' | 'accent';

export function UclPill({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  const variantClass = {
    default: 'bg-white/8 text-ucl-silver ring-1 ring-white/10',
    success: 'bg-emerald-500/14 text-emerald-300 ring-1 ring-emerald-400/20',
    warning: 'bg-yellow-500/14 text-yellow-300 ring-1 ring-yellow-400/20',
    danger: 'bg-red-500/14 text-red-300 ring-1 ring-red-400/20',
    accent: 'bg-cyan-400/14 text-cyan-300 ring-1 ring-cyan-300/20 shadow-ucl-glow',
  }[variant];

  return (
    <span className={['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide', variantClass].join(' ')}>
      {children}
    </span>
  );
}
