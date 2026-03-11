import { unstable_noStore as noStore } from 'next/cache';
import { TournamentClient } from '@/components/tournament/tournament-client';
import { readUniverse } from '@/lib/database/store';

export default async function TournamentPage() {
  noStore();
  const db = await readUniverse();
  const season = db.seasons.find((entry) => entry.id === db.meta.currentSeasonId);
  return <TournamentClient initialSeason={season} clubs={db.clubs} players={db.players} initialAutoplay={db.meta.autoplay} />;
}
