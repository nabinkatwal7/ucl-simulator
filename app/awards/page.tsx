import { getCurrentSeason } from '@/lib/database/queries';
import { readUniverse } from '@/lib/database/store';

export default async function AwardsPage() {
  const season = await getCurrentSeason();
  const db = await readUniverse();
  const clubs = new Map(db.clubs.map((club) => [club.id, club]));
  const players = new Map(db.players.map((player) => [player.id, player]));
  if (!season) return <div className="panel p-6 text-slate-300">No season generated yet.</div>;

  return (
    <div className="space-y-6">
      <section className="panel p-6"><div className="panel-title">Awards</div><h1 className="mt-3 text-4xl font-black text-white">Season honours</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="metric-card"><div className="panel-title">Champion</div><div className="mt-3 text-2xl font-black text-white">{clubs.get(season.championClubId ?? '')?.name ?? 'Pending'}</div></div>
        <div className="metric-card"><div className="panel-title">Top Scorer</div><div className="mt-3 text-2xl font-black text-white">{players.get(season.awards.topScorerPlayerId ?? '')?.name ?? 'Pending'}</div></div>
        <div className="metric-card"><div className="panel-title">Player of Tournament</div><div className="mt-3 text-2xl font-black text-white">{players.get(season.awards.playerOfTournamentId ?? '')?.name ?? 'Pending'}</div></div>
      </section>
    </div>
  );
}
