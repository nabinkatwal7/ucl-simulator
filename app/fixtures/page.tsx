import { getCurrentSeason } from '@/lib/database/queries';
import { readUniverse } from '@/lib/database/store';

export default async function FixturesPage() {
  const season = await getCurrentSeason();
  const db = await readUniverse();
  const clubs = new Map(db.clubs.map((club) => [club.id, club]));
  if (!season) return <div className="panel p-6 text-slate-300">No season generated yet.</div>;

  return (
    <section className="space-y-6">
      <div className="panel p-6"><div className="panel-title">Fixtures</div><h1 className="mt-3 text-4xl font-black text-white">League phase schedule</h1></div>
      <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 8 }, (_, index) => index + 1).map((round) => <div key={round} className="panel p-6"><div className="panel-title">Matchday {round}</div><div className="mt-4 space-y-3">{season.leagueFixtures.filter((fixture) => fixture.matchday === round).map((fixture) => <div key={fixture.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">{clubs.get(fixture.homeClubId)?.name} {fixture.homeGoals === null ? 'vs' : fixture.homeGoals} {fixture.homeGoals === null ? '' : '-'} {fixture.awayGoals === null ? '' : fixture.awayGoals} {clubs.get(fixture.awayClubId)?.name}</div>)}</div></div>)}</div>
    </section>
  );
}
