import type { ReactNode } from 'react';

export type StandingRow = {
  position: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export function UclStandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-ucl-silver">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Club</th>
              <th className="px-3 py-3 font-semibold">P</th>
              <th className="px-3 py-3 font-semibold">W</th>
              <th className="px-3 py-3 font-semibold">D</th>
              <th className="px-3 py-3 font-semibold">L</th>
              <th className="px-3 py-3 font-semibold">GF</th>
              <th className="px-3 py-3 font-semibold">GA</th>
              <th className="px-3 py-3 font-semibold">GD</th>
              <th className="px-4 py-3 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const zone = row.position <= 8 ? 'top8' : row.position <= 24 ? 'playoff' : 'out';
              return (
                <tr key={row.team} className={['border-t border-white/6 text-ucl-text transition-colors hover:bg-white/[0.04]', zone === 'top8' ? 'bg-emerald-500/[0.06]' : zone === 'playoff' ? 'bg-yellow-500/[0.05]' : 'bg-red-500/[0.05]'].join(' ')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={['h-8 w-1 rounded-full', zone === 'top8' ? 'bg-ucl-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : zone === 'playoff' ? 'bg-ucl-warning shadow-[0_0_10px_rgba(250,204,21,0.35)]' : 'bg-ucl-danger shadow-[0_0_10px_rgba(239,68,68,0.35)]'].join(' ')} />
                      <span className="font-semibold">{row.position}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.team}</td>
                  <td className="px-3 py-3">{row.played}</td>
                  <td className="px-3 py-3">{row.wins}</td>
                  <td className="px-3 py-3">{row.draws}</td>
                  <td className="px-3 py-3">{row.losses}</td>
                  <td className="px-3 py-3">{row.gf}</td>
                  <td className="px-3 py-3">{row.ga}</td>
                  <td className="px-3 py-3">{row.gd}</td>
                  <td className="px-4 py-3 text-base font-bold text-white">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-white/6 px-4 py-3 text-xs text-ucl-muted">
        <LegendDot className="bg-ucl-success" label="Top 8 qualify directly" />
        <LegendDot className="bg-ucl-warning" label="9–24 enter playoffs" />
        <LegendDot className="bg-ucl-danger" label="25–36 eliminated" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={['h-2.5 w-2.5 rounded-full', className].join(' ')} />
      {label}
    </div>
  );
}
