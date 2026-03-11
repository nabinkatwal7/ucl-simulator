type MatchCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  subtitle?: string;
  status?: string;
  highlight?: boolean;
};

export function UclMatchCard({ homeTeam, awayTeam, homeScore, awayScore, subtitle, status, highlight = false }: MatchCardProps) {
  return (
    <div className={['rounded-2xl border p-4 transition-all', 'border-white/10 bg-white/[0.04] backdrop-blur-sm', highlight ? 'shadow-ucl-glow ring-1 ring-cyan-300/20' : ''].join(' ').trim()}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-ucl-muted">{subtitle ?? 'League Phase'}</span>
        {status ? <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">{status}</span> : null}
      </div>

      <div className="space-y-3">
        <TeamLine team={homeTeam} score={homeScore} accent="from-cyan-300/40 to-blue-500/20" />
        <TeamLine team={awayTeam} score={awayScore} accent="from-slate-200/30 to-cyan-400/15" />
      </div>
    </div>
  );
}

function TeamLine({ team, score, accent }: { team: string; score?: number; accent: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="flex items-center gap-3">
        <div className={['h-9 w-9 rounded-full ring-1 ring-white/10 bg-gradient-to-br', accent].join(' ')} />
        <span className="font-semibold text-white">{team}</span>
      </div>
      <span className="text-xl font-bold text-white">{score ?? '-'}</span>
    </div>
  );
}
