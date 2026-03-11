import Link from 'next/link';
import { getClubs } from '@/lib/database/queries';

export default async function ClubsPage() {
  const clubs = await getClubs();
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Club Profiles</div>
        <h1 className="mt-3 text-4xl font-black text-white">European club pool</h1>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clubs.map((club) => (
          <Link key={club.id} href={`/clubs/${club.id}`} className="panel p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{club.name}</div>
                <div className="mt-1 text-sm text-slate-400">{club.country} · {club.league}</div>
              </div>
              <div className="badge-soft">{club.logo}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>Rating: {club.rating.toFixed(1)}</div>
              <div>Coefficient: {club.coefficient.toFixed(1)}</div>
              <div>Titles: {club.titles}</div>
              <div>Appearances: {club.appearances}</div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
