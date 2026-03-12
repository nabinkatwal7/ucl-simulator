import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  careerCompetitions,
  careers,
  clubs,
  competitionTemplates,
  leagueTables,
} from "../db/schema";

export async function getPrimaryCompetitionId(careerId: number) {
  const careerRows = await db
    .select({
      controlledClubId: careers.controlledClubId,
      seasonNumber: careers.currentSeasonNumber,
    })
    .from(careers)
    .where(eq(careers.id, careerId));

  if (careerRows.length === 0) {
    return null;
  }

  const clubRows = await db
    .select({ leagueId: clubs.leagueId })
    .from(clubs)
    .where(eq(clubs.id, careerRows[0].controlledClubId));

  if (clubRows.length === 0) {
    return null;
  }

  const templateRows = await db
    .select({ id: competitionTemplates.id })
    .from(competitionTemplates)
    .where(eq(competitionTemplates.leagueId, clubRows[0].leagueId));

  if (templateRows.length === 0) {
    return null;
  }

  const competitionRows = await db
    .select({ id: careerCompetitions.id })
    .from(careerCompetitions)
    .where(
      and(
        eq(careerCompetitions.careerId, careerId),
        eq(careerCompetitions.templateId, templateRows[0].id),
        eq(careerCompetitions.seasonNumber, careerRows[0].seasonNumber)
      )
    )
    .limit(1);

  return competitionRows[0]?.id ?? null;
}

export async function listStandings(competitionId: number, limit = 10) {
  return db
    .select({
      id: leagueTables.id,
      clubId: leagueTables.clubId,
      played: leagueTables.played,
      wins: leagueTables.wins,
      draws: leagueTables.draws,
      losses: leagueTables.losses,
      points: leagueTables.points,
      goalDifference: leagueTables.goalDifference,
      clubName: clubs.name,
    })
    .from(leagueTables)
    .leftJoin(clubs, eq(leagueTables.clubId, clubs.id))
    .where(eq(leagueTables.competitionId, competitionId))
    .orderBy(asc(leagueTables.rank))
    .limit(limit);
}
