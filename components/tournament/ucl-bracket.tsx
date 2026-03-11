type BracketMatch = {
  home: string;
  away: string;
  homeScore?: string;
  awayScore?: string;
  aggregate?: string;
};

type BracketRound = {
  name: string;
  matches: BracketMatch[];
};

export function UclBracket({ rounds }: { rounds: BracketRound[] }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-start gap-6">
        {rounds.map((round) => (
          <div key={round.name} className="w-[280px] shrink-0">
            <div className="mb-3 rounded-xl border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-center text-sm font-semibold tracking-wide text-cyan-200">
              {round.name}
            </div>

            <div className="space-y-5">
              {round.matches.map((match, index) => (
                <div key={`${round.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-ucl-sm">
                  <div className="space-y-2">
                    <BracketTeam name={match.home} score={match.homeScore} />
                    <BracketTeam name={match.away} score={match.awayScore} />
                  </div>
                  {match.aggregate ? <div className="mt-3 text-xs uppercase tracking-[0.18em] text-ucl-muted">Aggregate: <span className="text-ucl-silver">{match.aggregate}</span></div> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketTeam({ name, score }: { name: string; score?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
      <span className="font-medium text-white">{name}</span>
      <span className="font-bold text-white">{score ?? '-'}</span>
    </div>
  );
}
