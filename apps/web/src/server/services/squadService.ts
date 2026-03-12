import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { careerRosters, careers, clubs, players } from "../db/schema";

export async function listSquadForCareer(careerId: number) {
  const careerRows = await db
    .select({ controlledClubId: careers.controlledClubId })
    .from(careers)
    .where(eq(careers.id, careerId));

  if (careerRows.length === 0) {
    return [];
  }

  const clubId = careerRows[0].controlledClubId;

  return db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      overall: players.overall,
      primaryPosition: players.primaryPosition,
      clubName: clubs.name,
      morale: careerRosters.morale,
      fitness: careerRosters.fitness,
      squadRole: careerRosters.squadRole,
    })
    .from(careerRosters)
    .leftJoin(players, eq(careerRosters.playerId, players.id))
    .leftJoin(clubs, eq(careerRosters.clubId, clubs.id))
    .where(and(eq(careerRosters.careerId, careerId), eq(careerRosters.clubId, clubId)))
    .orderBy(asc(players.primaryPosition), asc(players.lastName))
    .limit(22);
}