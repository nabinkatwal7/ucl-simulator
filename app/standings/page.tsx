import { SimpleTable } from '@/components/tables/simple-table';
import { getCurrentSeason } from '@/lib/database/queries';
import { readUniverse } from '@/lib/database/store';

export default async function StandingsPage() {
  const season = await getCurrentSeason();
  const db = await readUniverse();
  const clubs = new Map(db.clubs.map((club) => [club.id, club]));
  if (!season) return <div className="panel p-6 text-slate-300">No season generated yet.</div>;

  return (
    <div className="space-y-6">
      <section className="panel p-6"><div className="panel-title">Standings</div><h1 className="mt-3 text-4xl font-black text-white">League table</h1></section>
      <SimpleTable headers={['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts']} rows={season.standings.map((row, index) => [String(index + 1), clubs.get(row.clubId)?.name ?? row.clubId, String(row.played), String(row.wins), String(row.draws), String(row.losses), String(row.goalsFor - row.goalsAgainst), String(row.points)])} />
    </div>
  );
}
