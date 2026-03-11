import Link from 'next/link';
import { getClubById } from '@/lib/database/queries';

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClubById(id);
  if (!data.club) return <div className="panel p-6 text-slate-300">Club not found.</div>;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Club Profile</div>
        <h1 className="mt-3 text-4xl font-black text-white">{data.club.name}</h1>
        <p className="mt-3 text-slate-300">{data.club.country} · {data.club.league}</p>
        <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
          <div>Rating: {data.club.rating.toFixed(1)}</div>
          <div>Coefficient: {data.club.coefficient.toFixed(1)}</div>
          <div>Titles: {data.club.titles}</div>
          <div>Finals: {data.club.finals}</div>
        </div>
      </section>
      <section className="panel p-6">
        <div className="panel-title">Squad</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
              {player.name} · {player.position} · {player.rating.toFixed(1)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
