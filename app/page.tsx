import { UclBracket } from '@/components/tournament/ucl-bracket';
import { UclHero } from '@/components/tournament/ucl-hero';
import { UclMatchCard } from '@/components/tournament/ucl-match-card';
import { UclStandingsTable, type StandingRow } from '@/components/tournament/ucl-standings-table';
import { UclLeaderboard } from '@/components/stats/ucl-leaderboard';
import { UclStatCard } from '@/components/stats/ucl-stat-card';
import { UclCard } from '@/components/ui/ucl-card';
import { getUniverseSnapshot } from '@/lib/database/queries';

export default async function HomePage() {
  const snapshot = await getUniverseSnapshot();
  const season = snapshot.currentSeason;
  const clubs = new Map(snapshot.clubs.map((club) => [club.id, club]));
  const standings: StandingRow[] = (season?.standings ?? []).slice(0, 10).map((row, index) => ({
    position: index + 1,
    team: clubs.get(row.clubId)?.name ?? row.clubId,
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    gf: row.goalsFor,
    ga: row.goalsAgainst,
    gd: row.goalsFor - row.goalsAgainst,
    points: row.points,
  }));

  const latestMatches = season?.leagueFixtures.filter((fixture) => fixture.homeGoals !== null).slice(-3).reverse() ?? [];
  const rounds = [
    { name: 'Playoffs', matches: season?.playoffTies.slice(0, 2).map((tie) => ({ home: clubs.get(tie.clubAId)?.name ?? tie.clubAId, away: clubs.get(tie.clubBId)?.name ?? tie.clubBId, homeScore: tie.legs[0].homeGoals?.toString() ?? '-', awayScore: tie.legs[0].awayGoals?.toString() ?? '-', aggregate: tie.winnerClubId ? `Winner: ${clubs.get(tie.winnerClubId)?.name}` : undefined })) ?? [] },
    { name: 'Round of 16', matches: season?.ro16Ties.slice(0, 2).map((tie) => ({ home: clubs.get(tie.clubAId)?.name ?? tie.clubAId, away: clubs.get(tie.clubBId)?.name ?? tie.clubBId, homeScore: tie.legs[0].homeGoals?.toString() ?? '-', awayScore: tie.legs[0].awayGoals?.toString() ?? '-', aggregate: tie.winnerClubId ? `Winner: ${clubs.get(tie.winnerClubId)?.name}` : undefined })) ?? [] },
    { name: 'Quarterfinals', matches: season?.quarterfinalTies.slice(0, 2).map((tie) => ({ home: clubs.get(tie.clubAId)?.name ?? tie.clubAId, away: clubs.get(tie.clubBId)?.name ?? tie.clubBId, homeScore: tie.legs[0].homeGoals?.toString() ?? '-', awayScore: tie.legs[0].awayGoals?.toString() ?? '-', aggregate: tie.winnerClubId ? `Winner: ${clubs.get(tie.winnerClubId)?.name}` : undefined })) ?? [] },
  ].filter((round) => round.matches.length > 0);

  return (
    <main className="min-h-screen space-y-6">
      <UclHero />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UclStatCard label="Current Stage" value={season ? season.currentStep : 'No season'} subtext={season ? `Step ${season.completedSteps.length + 1} in progress` : 'Generate a season to begin'} />
        <UclStatCard label="Top Scorer" value={season?.awards.topScorerPlayerId ? snapshot.players.find((player) => player.id === season.awards.topScorerPlayerId)?.name ?? 'Pending' : 'Open'} subtext="Live scoring race" />
        <UclStatCard label="Defending Champions" value={season?.defendingChampionClubId ? clubs.get(season.defendingChampionClubId)?.name ?? 'Unknown' : 'None'} subtext="Returning title holder" />
        <UclStatCard label="Season" value={season ? `${season.yearStart}/${String(season.yearEnd).slice(-2)}` : 'Not started'} subtext="Multi-season archive enabled" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <UclCard title="League Standings" subtitle="League Phase">
          {standings.length > 0 ? <UclStandingsTable rows={standings} /> : <div className="ucl-muted">Generate a season to populate the table.</div>}
        </UclCard>

        <div className="space-y-6">
          <UclCard title="Matchday Results" subtitle="Latest">
            <div className="space-y-3">
              {latestMatches.length > 0 ? latestMatches.map((match, index) => (
                <UclMatchCard key={match.id} homeTeam={clubs.get(match.homeClubId)?.name ?? match.homeClubId} awayTeam={clubs.get(match.awayClubId)?.name ?? match.awayClubId} homeScore={match.homeGoals ?? undefined} awayScore={match.awayGoals ?? undefined} status="FT" highlight={index === 0} />
              )) : <div className="ucl-muted">No simulated matches yet.</div>}
            </div>
          </UclCard>

          <UclLeaderboard
            title="Top Clubs"
            valueLabel="Coeff"
            rows={snapshot.clubs.slice(0, 3).map((club) => ({ name: club.name, club: club.country, value: club.coefficient.toFixed(0) }))}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <UclCard title="Knockout Bracket" subtitle="Road to the Final">
          {rounds.length > 0 ? <UclBracket rounds={rounds} /> : <div className="ucl-muted">Knockout rounds appear once the league phase finishes.</div>}
        </UclCard>

        <UclCard title="Competition Headlines" subtitle="Storylines">
          <div className="space-y-3">
            {(season?.headlines ?? ['Generate a season to unlock live storylines.']).slice(0, 4).map((item) => (
              <div key={item} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-ucl-silver">
                {item}
              </div>
            ))}
          </div>
        </UclCard>
      </section>
    </main>
  );
}
