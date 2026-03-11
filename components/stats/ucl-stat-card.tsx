import type { ReactNode } from 'react';

export function UclStatCard({ label, value, icon, subtext }: { label: string; value: string | number; icon?: ReactNode; subtext?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-ucl-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-ucl-muted">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white md:text-3xl">{value}</div>
      {subtext ? <div className="mt-2 text-sm text-ucl-muted">{subtext}</div> : null}
    </div>
  );
}
