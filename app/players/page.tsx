import Link from 'next/link';
import { getPlayers } from '@/lib/database/queries';

export default async function PlayersPage() {
  const players = await getPlayers();
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Player Profiles</div>
        <h1 className="mt-3 text-4xl font-black text-white">Persistent squad database</h1>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {players.slice(0, 120).map((player) => (
          <Link key={player.id} href={`/players/${player.id}`} className="panel p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
            <div className="flex items-center justify-between"><div className="text-sm font-bold text-white">{player.name}</div><span className="badge-soft">{player.position}</span></div>
            <div className="mt-2 text-sm text-slate-400">{player.nationality}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300"><div>Age: {player.age}</div><div>Rating: {player.rating.toFixed(1)}</div></div>
          </Link>
        ))}
      </section>
    </div>
  );
}
