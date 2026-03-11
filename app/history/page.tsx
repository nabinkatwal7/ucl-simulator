import { SimpleTable } from '@/components/tables/simple-table';
import { getUniverseSnapshot } from '@/lib/database/queries';

export default async function HistoryPage() {
  const snapshot = await getUniverseSnapshot();
  const clubs = new Map(snapshot.clubs.map((club) => [club.id, club]));
  const players = new Map(snapshot.players.map((player) => [player.id, player]));

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <div className="panel-title">Competition History</div>
        <h1 className="mt-3 text-4xl font-black text-white">Champions by season</h1>
      </div>
      <SimpleTable
        headers={['Season', 'Champion', 'Runner-up', 'Top Scorer', 'Player of Tournament']}
        rows={snapshot.history.map((entry) => [
          entry.label,
          clubs.get(entry.championClubId ?? '')?.name ?? 'Pending',
          clubs.get(entry.runnerUpClubId ?? '')?.name ?? 'Pending',
          players.get(entry.topScorerPlayerId ?? '')?.name ?? 'Pending',
          players.get(entry.playerOfTournamentId ?? '')?.name ?? 'Pending',
        ])}
      />
    </section>
  );
}
