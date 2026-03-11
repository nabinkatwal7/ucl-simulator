"use client";

import { useEffect, useState, useTransition } from 'react';
import { STEP_LABELS, STEP_ORDER } from '@/lib/models/constants';
import type { Club, Player, Season } from '@/lib/models/types';

interface Props {
  initialSeason?: Season;
  clubs: Club[];
  players: Player[];
  initialAutoplay: boolean;
}

export function TournamentClient({ initialSeason, clubs, players, initialAutoplay }: Props) {
  const [season, setSeason] = useState<Season | undefined>(initialSeason);
  const [autoplay, setAutoplay] = useState(initialAutoplay);
  const [isPending, startTransition] = useTransition();
  const clubLookup = new Map(clubs.map((club) => [club.id, club]));
  const playerLookup = new Map(players.map((player) => [player.id, player]));

  async function createSeason(action: 'create' | 'next') {
    const response = await fetch('/api/season', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json()) as { season?: Season; autoplay: boolean };
    setSeason(payload.season);
    setAutoplay(payload.autoplay);
    if (action === 'next') {
      window.location.reload();
    }
  }

  async function advance() {
    const response = await fetch('/api/advance', { method: 'POST' });
    const payload = (await response.json()) as { season: Season };
    setSeason(payload.season);
  }

  async function toggleAutoplay(next: boolean) {
    setAutoplay(next);
    await fetch('/api/season', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggleAutoplay', value: next }),
    });
  }

  useEffect(() => {
    if (!autoplay || !season || season.currentStep === 'seasonHighlights' || isPending) {
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(() => {
        void advance();
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [autoplay, season, isPending]);

  if (!season) {
    return (
      <section className="section-shell overflow-hidden bg-stadium-glow text-center">
        <div className="mx-auto max-w-3xl py-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-ucl-glow/35 bg-ucl-card/80 shadow-cyan">
            <BallGlyph />
          </div>
          <div className="panel-title mt-6">Generate Season</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ucl-platinum sm:text-5xl">Start the living universe</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ucl-silver sm:text-lg">
            Build the first persistent Champions League season, store it locally, and progress exactly one draw, matchday, leg, or final at a time.
          </p>
          <button
            type="button"
            onClick={() => startTransition(() => void createSeason('create'))}
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-ucl-accent px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-ucl-bg transition hover:bg-ucl-glow"
          >
            <PlayGlyph />
            Generate Season
          </button>
        </div>
      </section>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(season.currentStep);
  const canAdvance = season.currentStep !== 'seasonHighlights';
  const nextStepLabel = canAdvance ? STEP_LABELS[STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]] : 'Season Complete';
  const qualified = season.qualifiedClubIds.map((clubId) => clubLookup.get(clubId)).filter((club): club is Club => Boolean(club));
  const topScorer = season.awards.topScorerPlayerId ? playerLookup.get(season.awards.topScorerPlayerId) : undefined;
  const playerOfTournament = season.awards.playerOfTournamentId ? playerLookup.get(season.awards.playerOfTournamentId) : undefined;

  return (
    <div className="space-y-8">
      <section className="section-shell data-grid overflow-hidden bg-stadium-glow">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr] xl:items-end">
          <div className="space-y-5">
            <div className="badge-soft border-ucl-accent/25 bg-ucl-accent/10 text-ucl-heading">
              <ShieldGlyph />
              Tournament Console
            </div>
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-ucl-platinum sm:text-5xl xl:text-6xl">
                {season.yearStart}/{String(season.yearEnd).slice(-2)} UEFA Champions League
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ucl-silver sm:text-lg">
                Manual progression is primary. Every press of the next button moves the universe forward by one exact tournament chunk and never skips ahead.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <ControlCard
              icon={<BoltGlyph />}
              label="Current Step"
              value={STEP_LABELS[season.currentStep]}
              note={`${stepIndex + 1} of ${STEP_ORDER.length}`}
            />
            <div className="rounded-[28px] border border-ucl-glow/20 bg-ucl-surface/80 p-5 shadow-neon">
              <div className="flex flex-wrap gap-3">
                <ActionButton onClick={() => startTransition(() => void toggleAutoplay(!autoplay))} tone="secondary">
                  <PulseGlyph />
                  {autoplay ? 'Disable Autoplay' : 'Enable Autoplay'}
                </ActionButton>
                <ActionButton disabled={!canAdvance || isPending} onClick={() => startTransition(() => void advance())} tone="primary">
                  <PlayGlyph />
                  {nextStepLabel}
                </ActionButton>
                {season.currentStep === 'seasonHighlights' ? (
                  <ActionButton onClick={() => startTransition(() => void createSeason('next'))} tone="purple">
                    <ArrowGlyph />
                    Advance To Next Season
                  </ActionButton>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<ChartGlyph />} label="Qualified Clubs" value={String(season.qualifiedClubIds.length)} hint={`${season.newClubIds.length} new this season`} />
        <MetricCard icon={<MedalGlyph />} label="League Leader" value={season.standings[0] ? clubLookup.get(season.standings[0].clubId)?.name ?? '-' : '-'} hint="Live table leader" />
        <MetricCard icon={<CrownGlyph />} label="Champion" value={season.championClubId ? clubLookup.get(season.championClubId)?.name ?? '-' : 'Pending'} hint="Confirmed after the final" />
        <MetricCard icon={<SparkGlyph />} label="Awards Race" value={topScorer?.name ?? 'Open'} hint="Golden Boot leader" />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <div className="section-shell">
            <SectionHeading icon={<StepsGlyph />} eyebrow="Progress Tracker" title="Tournament path" subtitle="Every stage is visible and spaced clearly so the flow reads like a broadcast rundown rather than a cramped admin list." compact={false} />
            <div className="mt-7 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {STEP_ORDER.map((step, index) => {
                const active = step === season.currentStep;
                const complete = stepIndex > index;
                return (
                  <div
                    key={step}
                    className={[
                      'rounded-[24px] border px-5 py-4 transition',
                      active
                        ? 'border-ucl-accent/55 bg-ucl-accent/12 shadow-cyan'
                        : complete
                          ? 'border-ucl-qualified/30 bg-ucl-qualified/10'
                          : 'border-ucl-divider/45 bg-ucl-surface/65',
                    ].join(' ')}
                  >
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ucl-silver/75">Step {index + 1}</div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-ucl-heading">{STEP_LABELS[step]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-shell">
            <SectionHeading icon={<StadiumGlyph />} eyebrow="Stage View" title="Current tournament scene" subtitle="Live draw panels, fixture cards, knockout ties, and the final are all shown in one roomy viewport." compact={false} />
            <StageView season={season} clubs={clubLookup} players={playerLookup} />
          </div>

          <div className="section-shell">
            <SectionHeading icon={<BranchGlyph />} eyebrow="Knockout Route" title="Bracket map" subtitle="Each round has its own lane so the elimination path feels legible and premium." compact={false} />
            <BracketView season={season} clubs={clubLookup} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="section-shell">
            <SectionHeading icon={<TableGlyph />} eyebrow="League Standings" title="League phase table" subtitle="Qualification zones use the requested green, yellow, and red coding." compact />
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ucl-divider/45 text-xs uppercase tracking-[0.24em] text-ucl-silver/80">
                    <th className="pb-4 pr-4">#</th>
                    <th className="pb-4 pr-4">Club</th>
                    <th className="pb-4 pr-4">P</th>
                    <th className="pb-4 pr-4">W</th>
                    <th className="pb-4 pr-4">D</th>
                    <th className="pb-4 pr-4">L</th>
                    <th className="pb-4 pr-4">GD</th>
                    <th className="pb-4">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {season.standings.map((row, index) => (
                    <tr key={row.clubId} className="border-t border-ucl-divider/30 hover:bg-ucl-hover/30">
                      <td className="py-4 pr-4">
                        <span className={['inline-flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold', zoneClass(index)].join(' ')}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-ucl-heading">{clubLookup.get(row.clubId)?.name}</div>
                        <div className="mt-1 text-xs text-ucl-silver/75">{qualificationLabel(index)}</div>
                      </td>
                      <td className="py-4 pr-4 text-ucl-silver">{row.played}</td>
                      <td className="py-4 pr-4 text-ucl-silver">{row.wins}</td>
                      <td className="py-4 pr-4 text-ucl-silver">{row.draws}</td>
                      <td className="py-4 pr-4 text-ucl-silver">{row.losses}</td>
                      <td className="py-4 pr-4 text-ucl-silver">{row.goalsFor - row.goalsAgainst}</td>
                      <td className="py-4 font-black text-ucl-platinum">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="section-shell">
            <SectionHeading icon={<NewsGlyph />} eyebrow="Headlines" title="Storylines" subtitle="Automated headlines turn the simulation into an ongoing UCL narrative." compact />
            <div className="mt-6 space-y-3">
              {season.headlines.map((headline, index) => (
                <div key={`${headline}-${index}`} className="rounded-[22px] border border-ucl-divider/45 bg-ucl-surface/70 px-5 py-4 text-sm leading-6 text-ucl-heading">
                  {headline}
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell">
            <SectionHeading icon={<AwardGlyph />} eyebrow="Awards Pulse" title="Major races" subtitle="Top performers are visible without leaving the live season page." compact />
            <div className="mt-6 grid gap-3">
              <AwardLine label="Top scorer" value={topScorer ? topScorer.name : 'Pending'} />
              <AwardLine label="Player of tournament" value={playerOfTournament ? playerOfTournament.name : 'Pending'} />
              <AwardLine label="Best goalkeeper" value={season.awards.bestGoalkeeperPlayerId ? playerLookup.get(season.awards.bestGoalkeeperPlayerId)?.name ?? 'Pending' : 'Pending'} />
              <AwardLine label="Breakthrough club" value={season.review.breakthroughClubId ? clubLookup.get(season.review.breakthroughClubId)?.name ?? 'Pending' : 'Pending'} />
            </div>
          </div>

          <div className="section-shell">
            <SectionHeading icon={<ClubGlyph />} eyebrow="Qualified Clubs" title="Season field" subtitle="New entrants are tagged so rotation across seasons is obvious at a glance." compact />
            <div className="mt-6 flex flex-wrap gap-3">
              {qualified.map((club) => (
                <span key={club.id} className={['badge-soft px-4 py-2', season.newClubIds.includes(club.id) ? 'border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100' : 'border-ucl-divider/45 bg-ucl-surface/70'].join(' ')}>
                  <span className="font-black tracking-[0.12em] text-ucl-accent">{club.logo}</span>
                  {club.name}
                  {season.newClubIds.includes(club.id) ? <span className="rounded-full bg-fuchsia-300/18 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">New</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function zoneClass(index: number) {
  if (index < 8) return 'zone-qualified';
  if (index < 24) return 'zone-playoff';
  return 'zone-eliminated';
}

function qualificationLabel(index: number) {
  if (index < 8) return 'Round of 16';
  if (index < 24) return 'Playoff';
  return 'Eliminated';
}

function ActionButton({ children, disabled, onClick, tone }: { children: React.ReactNode; disabled?: boolean; onClick: () => void; tone: 'primary' | 'secondary' | 'purple' }) {
  const toneClass = tone === 'primary'
    ? 'bg-ucl-accent text-ucl-bg hover:bg-ucl-glow'
    : tone === 'purple'
      ? 'bg-fuchsia-400 text-ucl-bg hover:bg-fuchsia-300'
      : 'border border-ucl-divider/45 bg-ucl-card/70 text-ucl-heading hover:bg-ucl-hover';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={['inline-flex items-center gap-3 rounded-full px-5 py-3.5 text-sm font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300', toneClass].join(' ')}
    >
      {children}
    </button>
  );
}

function SectionHeading({ icon, eyebrow, title, subtitle, compact = false }: { icon: React.ReactNode; eyebrow: string; title: string; subtitle: string; compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-start gap-4' : 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ucl-glow/30 bg-ucl-card/90 text-ucl-accent shadow-cyan">
          {icon}
        </div>
        <div>
          <div className="panel-title">{eyebrow}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ucl-platinum">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ucl-silver">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="panel-title">{label}</div>
          <div className="mt-4 text-3xl font-black tracking-tight text-ucl-platinum">{value}</div>
          <div className="mt-3 text-sm leading-6 text-ucl-silver">{hint}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-ucl-glow/30 bg-ucl-card/95 text-ucl-accent shadow-cyan">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ControlCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-[28px] border border-ucl-glow/20 bg-ucl-surface/80 p-5 shadow-neon">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="panel-title">{label}</div>
          <div className="mt-3 text-2xl font-black leading-tight text-ucl-platinum">{value}</div>
          <div className="mt-3 text-sm text-ucl-silver">{note}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-ucl-glow/30 bg-ucl-card text-ucl-accent shadow-cyan">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AwardLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-ucl-divider/45 bg-ucl-surface/70 px-5 py-4">
      <span className="text-sm text-ucl-silver">{label}</span>
      <span className="text-sm font-semibold text-ucl-heading">{value}</span>
    </div>
  );
}

function StageView({ season, clubs, players }: { season: Season; clubs: Map<string, Club>; players: Map<string, Player> }) {
  if (season.currentStep === 'seasonGenerated') {
    return (
      <div className="mt-7 space-y-5">
        <p className="max-w-3xl text-sm leading-7 text-ucl-silver">
          Qualified clubs and pots are locked in. The next click performs the league draw and reveals the first 18 fixtures.
        </p>
        <PotGrid season={season} clubs={clubs} />
      </div>
    );
  }

  if (season.currentStep === 'leagueDraw') {
    return <FixtureList title="League Draw" fixtures={season.leagueFixtures.slice(0, 18)} clubs={clubs} subtitle="Opening slate from the newly generated schedule." />;
  }

  if (season.currentStep.startsWith('leagueMatchday')) {
    const round = Number(season.currentStep.replace('leagueMatchday', ''));
    return <FixtureList title={`League Matchday ${round}`} fixtures={season.leagueFixtures.filter((fixture) => fixture.matchday === round)} clubs={clubs} subtitle="Exactly one matchday has been simulated on this step." />;
  }

  if (season.currentStep === 'finalLeagueTable') {
    return (
      <div className="mt-7 rounded-[28px] border border-ucl-divider/45 bg-ucl-surface/75 p-6 text-ucl-silver">
        Top eight go directly to the Round of 16. Places 9 to 24 enter the playoff round. Positions 25 to 36 are eliminated.
      </div>
    );
  }

  if (season.currentStep === 'playoffDraw') return <TieList title="Playoff Draw" ties={season.playoffTies} clubs={clubs} />;
  if (season.currentStep === 'playoffFirstLegs' || season.currentStep === 'playoffSecondLegs') return <TieList title="Playoffs" ties={season.playoffTies} clubs={clubs} showResults />;
  if (season.currentStep === 'ro16Draw') return <TieList title="Round of 16 Draw" ties={season.ro16Ties} clubs={clubs} />;
  if (season.currentStep === 'ro16FirstLegs' || season.currentStep === 'ro16SecondLegs') return <TieList title="Round of 16" ties={season.ro16Ties} clubs={clubs} showResults />;
  if (season.currentStep === 'quarterfinalFirstLegs' || season.currentStep === 'quarterfinalSecondLegs') return <TieList title="Quarterfinals" ties={season.quarterfinalTies} clubs={clubs} showResults />;
  if (season.currentStep === 'semifinalFirstLegs' || season.currentStep === 'semifinalSecondLegs') return <TieList title="Semifinals" ties={season.semifinalTies} clubs={clubs} showResults />;
  if (season.currentStep === 'final' || season.currentStep === 'champion' || season.currentStep === 'seasonHighlights') {
    return (
      <div className="mt-7 rounded-[30px] border border-ucl-glow/30 bg-gradient-to-br from-ucl-card to-ucl-surface p-7 shadow-neon">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="panel-title">Final</div>
            <h3 className="mt-3 text-3xl font-black text-ucl-platinum sm:text-4xl">
              {clubs.get(season.finalMatch?.homeClubId ?? '')?.name} vs {clubs.get(season.finalMatch?.awayClubId ?? '')?.name}
            </h3>
            <p className="mt-4 text-sm leading-6 text-ucl-silver">
              Champion: {season.championClubId ? clubs.get(season.championClubId)?.name : 'Pending'}
            </p>
            {season.awards.topScorerPlayerId ? (
              <p className="mt-2 text-sm leading-6 text-ucl-silver">
                Top scorer: {players.get(season.awards.topScorerPlayerId)?.name}
              </p>
            ) : null}
          </div>
          <div className="rounded-[26px] border border-ucl-glow/30 bg-ucl-bg/35 px-8 py-6 text-center shadow-cyan">
            <div className="text-[11px] uppercase tracking-[0.3em] text-ucl-silver/80">Score</div>
            <div className="mt-3 text-5xl font-black text-ucl-platinum">{season.finalMatch?.homeGoals ?? '-'} - {season.finalMatch?.awayGoals ?? '-'}</div>
            {season.finalMatch?.penalties ? <div className="mt-3 text-sm text-ucl-silver">Pens {season.finalMatch.penaltyHome} - {season.finalMatch.penaltyAway}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function PotGrid({ season, clubs }: { season: Season; clubs: Map<string, Club> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {season.pots.map((pot, index) => (
        <div key={index} className="rounded-[28px] border border-ucl-divider/45 bg-ucl-surface/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="panel-title">Pot {index + 1}</div>
            <div className="badge-soft border-ucl-glow/20 bg-ucl-card/85">9 clubs</div>
          </div>
          <div className="mt-5 grid gap-3">
            {pot.map((clubId) => (
              <div key={clubId} className="flex items-center justify-between rounded-[20px] border border-ucl-divider/35 bg-ucl-card/65 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ucl-accent/10 text-[11px] font-black tracking-[0.14em] text-ucl-accent">{clubs.get(clubId)?.logo}</span>
                  <span className="font-semibold text-ucl-heading">{clubs.get(clubId)?.name}</span>
                </div>
                <span className="text-sm text-ucl-silver">{clubs.get(clubId)?.country}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FixtureList({ title, fixtures, clubs, subtitle }: { title: string; fixtures: Array<{ id: string; homeClubId: string; awayClubId: string; homeGoals: number | null; awayGoals: number | null }>; clubs: Map<string, Club>; subtitle: string }) {
  return (
    <div className="mt-7">
      <h3 className="text-3xl font-black tracking-tight text-ucl-platinum">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ucl-silver">{subtitle}</p>
      <div className="mt-6 grid gap-4 2xl:grid-cols-2">
        {fixtures.map((fixture) => (
          <div key={fixture.id} className="rounded-[24px] border border-ucl-divider/45 bg-ucl-surface/72 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <ClubName club={clubs.get(fixture.homeClubId)} align="left" />
              <div className="min-w-28 text-center text-2xl font-black text-ucl-platinum">
                {fixture.homeGoals === null ? 'vs' : `${fixture.homeGoals} - ${fixture.awayGoals}`}
              </div>
              <ClubName club={clubs.get(fixture.awayClubId)} align="right" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TieList({ title, ties, clubs, showResults = false }: { title: string; ties: Season['playoffTies']; clubs: Map<string, Club>; showResults?: boolean }) {
  return (
    <div className="mt-7">
      <h3 className="text-3xl font-black tracking-tight text-ucl-platinum">{title}</h3>
      <div className="mt-6 grid gap-5">
        {ties.map((tie) => (
          <div key={tie.id} className="rounded-[28px] border border-ucl-divider/45 bg-ucl-surface/72 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-bold text-ucl-heading">{clubs.get(tie.clubAId)?.name} vs {clubs.get(tie.clubBId)?.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.24em] text-ucl-silver/75">{tie.stage}</div>
              </div>
              {tie.winnerClubId ? <span className="badge-soft border-ucl-accent/25 bg-ucl-accent/10 text-ucl-heading">Winner: {clubs.get(tie.winnerClubId)?.name}</span> : null}
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {tie.legs.map((leg) => (
                <div key={leg.id} className="rounded-[22px] border border-ucl-divider/35 bg-ucl-card/65 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-ucl-silver/75">Leg {leg.leg}</div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <ClubName club={clubs.get(leg.homeClubId)} align="left" />
                    <div className="min-w-24 text-center text-xl font-black text-ucl-platinum">
                      {showResults && leg.homeGoals !== null ? `${leg.homeGoals} - ${leg.awayGoals}` : 'vs'}
                    </div>
                    <ClubName club={clubs.get(leg.awayClubId)} align="right" />
                  </div>
                  {leg.penalties ? <div className="mt-3 text-xs text-ucl-silver">Pens {leg.penaltyHome} - {leg.penaltyAway}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketView({ season, clubs }: { season: Season; clubs: Map<string, Club> }) {
  const groups = [
    { label: 'Playoffs', ties: season.playoffTies },
    { label: 'Round of 16', ties: season.ro16Ties },
    { label: 'Quarterfinals', ties: season.quarterfinalTies },
    { label: 'Semifinals', ties: season.semifinalTies },
  ].filter((group) => group.ties.length > 0);

  if (groups.length === 0) {
    return <p className="mt-6 text-sm leading-7 text-ucl-silver">Knockout bracket will appear once the league phase is complete.</p>;
  }

  return (
    <div className="mt-7 grid gap-5 2xl:grid-cols-4">
      {groups.map((group) => (
        <div key={group.label} className="rounded-[28px] border border-ucl-divider/45 bg-ucl-surface/72 p-5">
          <div className="panel-title">{group.label}</div>
          <div className="mt-5 space-y-4">
            {group.ties.map((tie) => (
              <div key={tie.id} className="rounded-[22px] border border-ucl-divider/35 bg-ucl-card/65 px-4 py-4">
                <div className="font-semibold text-ucl-heading">{clubs.get(tie.clubAId)?.name}</div>
                <div className="my-2 text-xs uppercase tracking-[0.24em] text-ucl-silver/70">vs</div>
                <div className="font-semibold text-ucl-heading">{clubs.get(tie.clubBId)?.name}</div>
                <div className="mt-3 text-sm text-ucl-silver">{tie.winnerClubId ? `Winner: ${clubs.get(tie.winnerClubId)?.name}` : 'Tie in progress'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClubName({ club, align }: { club?: Club; align: 'left' | 'right' }) {
  return (
    <div className={['flex min-w-0 items-center gap-3', align === 'right' ? 'flex-row-reverse text-right' : 'text-left'].join(' ')}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ucl-glow/25 bg-ucl-accent/10 text-[11px] font-black tracking-[0.12em] text-ucl-accent">
        {club?.logo}
      </span>
      <span className="min-w-0 truncate text-sm font-semibold text-ucl-heading sm:text-base">{club?.name}</span>
    </div>
  );
}

function IconFrame({ children }: { children: React.ReactNode }) {
  return <span className="flex h-5 w-5 items-center justify-center">{children}</span>;
}
function BallGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M12 4.5 8 7l1.3 4L12 9.5 14.7 11 16 7l-4-2.5Z" /><path d="m9 11-3 2m12-2 3 2m-9 1 1.5 4m3-4-1.5 4" /></svg></IconFrame>;
}
function PlayGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="m8 6 10 6-10 6V6Z" /></svg></IconFrame>;
}
function ShieldGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5 6v5c0 4.5 2.9 7.8 7 10 4.1-2.2 7-5.5 7-10V6l-7-3Z" /></svg></IconFrame>;
}
function BoltGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" /></svg></IconFrame>;
}
function PulseGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-4 4 8 2-4h6" /></svg></IconFrame>;
}
function ArrowGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14m-5-5 5 5-5 5" /></svg></IconFrame>;
}
function ChartGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V5m0 14h16M8 15l3-3 2 2 5-6" /></svg></IconFrame>;
}
function MedalGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="14" r="4" /><path d="M9 3h6l-1 5h-4L9 3Z" /></svg></IconFrame>;
}
function CrownGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 17 2-9 6 5 6-5 2 9H4Zm2 3h12" /></svg></IconFrame>;
}
function SparkGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v5m0 8v5M3 12h5m8 0h5m-3.5-6.5-3 3m-5 5-3 3m0-11 3 3m5 5 3 3" /></svg></IconFrame>;
}
function StepsGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 17h4v3H4zm6-6h4v9h-4zm6-6h4v15h-4z" /></svg></IconFrame>;
}
function StadiumGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 18V9l8-4 8 4v9M7 18v-5m10 5v-5M4 18h16" /></svg></IconFrame>;
}
function BranchGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 5h8M8 12h8M8 19h8M8 5v14M16 5v7" /></svg></IconFrame>;
}
function TableGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M9 5v14" /></svg></IconFrame>;
}
function NewsGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 6h14v12H5zM8 9h8M8 12h8M8 15h5" /></svg></IconFrame>;
}
function AwardGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 4h8v4a4 4 0 1 1-8 0V4Zm4 8v4m-3 4h6" /><path d="M8 6H5a2 2 0 0 0 2 3h1m8-3h3a2 2 0 0 1-2 3h-1" /></svg></IconFrame>;
}
function ClubGlyph() {
  return <IconFrame><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 20c0-3.2 3.1-5 7-5s7 1.8 7 5" /></svg></IconFrame>;
}
