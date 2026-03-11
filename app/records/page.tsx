import Link from 'next/link';
import { getUniverseSnapshot } from '@/lib/database/queries';

export default async function RecordsPage() {
  const snapshot = await getUniverseSnapshot();
  const clubs = new Map(snapshot.clubs.map((club) => [club.id, club]));
  const players = new Map(snapshot.players.map((player) => [player.id, player]));

  const recordGroups = [
    { label: 'Most titles', ids: snapshot.records.mostTitlesClubIds, type: 'club' as const },
    { label: 'Most finals', ids: snapshot.records.mostFinalsClubIds, type: 'club' as const },
    { label: 'Most goals', ids: snapshot.records.mostGoalsPlayerIds, type: 'player' as const },
    { label: 'Most assists', ids: snapshot.records.mostAssistsPlayerIds, type: 'player' as const },
    { label: 'Most clean sheets', ids: snapshot.records.mostCleanSheetsPlayerIds, type: 'player' as const },
  ];

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Records</div>
        <h1 className="mt-3 text-4xl font-black text-white">All-time leaders</h1>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {recordGroups.map((group) => (
          <div key={group.label} className="panel p-6">
            <div className="panel-title">{group.label}</div>
            <div className="mt-4 space-y-3">
              {group.ids.map((id, index) => group.type === 'club' ? (
                <Link key={id} href={`/clubs/${id}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                  <span>{index + 1}. {clubs.get(id)?.name}</span>
                  <span className="text-slate-400">{group.label === 'Most titles' ? clubs.get(id)?.titles : clubs.get(id)?.finals}</span>
                </Link>
              ) : (
                <Link key={id} href={`/players/${id}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                  <span>{index + 1}. {players.get(id)?.name}</span>
                  <span className="text-slate-400">Career record</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
