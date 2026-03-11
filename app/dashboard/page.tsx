import Link from 'next/link';
import { MetricStrip } from '@/components/ui/metric-strip';
import { getUniverseSnapshot } from '@/lib/database/queries';

export default async function DashboardPage() {
  const snapshot = await getUniverseSnapshot();
  const season = snapshot.currentSeason;
  const recentHistory = snapshot.history.slice(0, 5);
  const clubs = new Map(snapshot.clubs.map((club) => [club.id, club]));
  const players = new Map(snapshot.players.map((player) => [player.id, player]));

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Command Center</div>
        <h1 className="mt-3 text-4xl font-black text-white">Competition dashboard</h1>
        <p className="mt-3 text-slate-300">Track the live season, leading clubs, recent champions, and award races from one premium broadcast-style view.</p>
      </section>

      <MetricStrip items={[
        { label: 'Live Step', value: season ? season.currentStep : 'None', hint: 'One click advances one chunk' },
        { label: 'League Leader', value: season?.standings[0] ? clubs.get(season.standings[0].clubId)?.name ?? '-' : '-', hint: 'Current table leader' },
        { label: 'Top Scorer Race', value: season?.awards.topScorerPlayerId ? players.get(season.awards.topScorerPlayerId)?.name ?? '-' : 'Open', hint: 'Season leaderboard' },
        { label: 'Recent Champion', value: snapshot.history[0]?.championClubId ? clubs.get(snapshot.history[0].championClubId)?.name ?? '-' : 'None', hint: 'Last completed season' },
      ]} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <div className="panel-title">Live Headlines</div>
          <div className="mt-4 space-y-3">
            {(season?.headlines ?? ['Generate or continue a season to populate live storylines.']).map((headline, index) => (
              <div key={`${headline}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{headline}</div>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <div className="panel-title">Recent Champions</div>
          <div className="mt-4 space-y-3">
            {recentHistory.map((entry) => (
              <Link key={entry.seasonId} href="/history" className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                <div className="text-sm font-semibold text-white">{entry.label}</div>
                <div className="mt-1 text-sm text-slate-400">Champion: {entry.championClubId ? clubs.get(entry.championClubId)?.name : 'Pending'}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
