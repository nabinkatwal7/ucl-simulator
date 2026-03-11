type LeaderRow = {
  name: string;
  club: string;
  value: number | string;
};

export function UclLeaderboard({ title, rows, valueLabel }: { title: string; rows: LeaderRow[]; valueLabel?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-ucl-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-ucl-silver">{title}</h3>
        {valueLabel ? <span className="text-xs text-ucl-muted">{valueLabel}</span> : null}
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.name}-${index}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
            <div className="text-center text-sm font-bold text-cyan-300">{index + 1}</div>
            <div>
              <div className="font-medium text-white">{row.name}</div>
              <div className="text-xs text-ucl-muted">{row.club}</div>
            </div>
            <div className="text-lg font-bold text-white">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
