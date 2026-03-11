import { NextResponse } from 'next/server';
import { mutateUniverse } from '@/lib/database/store';
import { advanceTournamentStep } from '@/lib/simulation/engine';

export async function POST() {
  const result = await mutateUniverse((db) => advanceTournamentStep(db));
  return NextResponse.json(result);
}
