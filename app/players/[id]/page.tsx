import { getPlayerById } from '@/lib/database/queries';

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data.player) return <div className="panel p-6 text-slate-300">Player not found.</div>;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Player Profile</div>
        <h1 className="mt-3 text-4xl font-black text-white">{data.player.name}</h1>
        <p className="mt-3 text-slate-300">{data.player.nationality} · {data.player.position}</p>
        <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
          <div>Age: {data.player.age}</div>
          <div>Rating: {data.player.rating.toFixed(1)}</div>
          <div>Role: {data.player.roleImportance}</div>
          <div>Club ID: {data.player.clubId}</div>
        </div>
      </section>
      <section className="panel p-6">
        <div className="panel-title">Recent Match Involvement</div>
        <div className="mt-4 space-y-3">
          {data.matches.map((match) => (
            <div key={match.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
              {match.stage} · {match.homeGoals} - {match.awayGoals}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
