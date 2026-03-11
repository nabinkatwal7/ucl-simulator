import { NextResponse } from 'next/server';
import { mutateUniverse, readUniverse } from '@/lib/database/store';
import { ensureSeason, generateSeason } from '@/lib/simulation/engine';

export async function GET() {
  const db = await readUniverse();
  const season = db.seasons.find((entry) => entry.id === db.meta.currentSeasonId);
  return NextResponse.json({ season, autoplay: db.meta.autoplay });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === 'string' ? body.action : 'create';

  const result = await mutateUniverse((db) => {
    if (action === 'toggleAutoplay') {
      db.meta.autoplay = Boolean(body.value);
      return { season: db.seasons.find((entry) => entry.id === db.meta.currentSeasonId), autoplay: db.meta.autoplay };
    }

    const current = db.seasons.find((entry) => entry.id === db.meta.currentSeasonId);
    const season = !current ? generateSeason(db) : current.status === 'completed' && action === 'next' ? generateSeason(db) : ensureSeason(db);
    return { season, autoplay: db.meta.autoplay };
  });

  return NextResponse.json(result);
}
