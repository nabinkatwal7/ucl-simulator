import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  careerCompetitions,
  careers,
  clubs,
  competitionTemplates,
  fixtures,
  inboxMessages,
  leagueTables,
  leagues,
} from "../db/schema";
import { simulateFixture } from "./fixtureSimService";

function generateRoundRobin(clubIds: number[]) {
  const teams = [...clubIds];
  if (teams.length % 2 !== 0) {
    teams.push(-1);
  }

  const rounds: Array<Array<[number, number]>> = [];
  const totalRounds = teams.length - 1;
  const half = teams.length / 2;

  for (let round = 0; round < totalRounds; round += 1) {
    const pairings: Array<[number, number]> = [];
    for (let i = 0; i < half; i += 1) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== -1 && away !== -1) {
        pairings.push([home, away]);
      }
    }
    rounds.push(pairings);
    const fixed = teams[0];
    const rest = teams.slice(1);
    rest.unshift(rest.pop()!);
    teams.splice(0, teams.length, fixed, ...rest);
  }

  const secondLegs = rounds.map((pairings) =>
    pairings.map(([home, away]) => [away, home] as [number, number])
  );

  return [...rounds, ...secondLegs];
}

export async function generateSeasonFixtures(careerId: number) {
  const careerRows = await db
    .select({
      id: careers.id,
      currentDate: careers.currentDate,
      currentSeasonNumber: careers.currentSeasonNumber,
    })
    .from(careers)
    .where(eq(careers.id, careerId));

  if (careerRows.length === 0) {
    return null;
  }

  const seasonNumber = careerRows[0].currentSeasonNumber;
  const seasonStart =
    careerRows[0].currentDate instanceof Date
      ? careerRows[0].currentDate
      : new Date(careerRows[0].currentDate);

  const templates = await db.select().from(competitionTemplates);

  for (const template of templates) {
    const existing = await db
      .select({ id: careerCompetitions.id })
      .from(careerCompetitions)
      .where(
        and(
          eq(careerCompetitions.careerId, careerId),
          eq(careerCompetitions.templateId, template.id),
          eq(careerCompetitions.seasonNumber, seasonNumber)
        )
      );

    if (existing.length > 0) {
      continue;
    }

    const competitionRows = await db
      .insert(careerCompetitions)
      .values({
        careerId,
        templateId: template.id,
        seasonNumber,
        name: template.name,
        stage: "league",
        status: "active",
      })
      .returning({ id: careerCompetitions.id });

    const competitionId = competitionRows[0].id;

    const league = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.id, template.leagueId ?? -1));

    if (league.length === 0) {
      continue;
    }

    const leagueClubs = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.leagueId, league[0].id));

    const clubIds = leagueClubs.map((club) => club.id);
    const rounds = generateRoundRobin(clubIds);

    const fixturesToInsert = rounds.flatMap((pairings, index) => {
      const matchday = index + 1;
      const scheduledDate = new Date(seasonStart);
      scheduledDate.setUTCDate(seasonStart.getUTCDate() + index * 7);

      return pairings.map(([home, away]) => ({
        careerId,
        competitionId,
        seasonNumber,
        matchdayNumber: matchday,
        roundName: `Matchday ${matchday}`,
        homeClubId: home,
        awayClubId: away,
        scheduledDate,
        kickoffLabel: "15:00",
        resultStatus: "pending",
        homeGoals: null,
        awayGoals: null,
        extraTimeUsed: 0,
        penaltiesUsed: 0,
        winnerClubId: null,
      }));
    });

    await db.insert(fixtures).values(fixturesToInsert);

    await db.insert(leagueTables).values(
      clubIds.map((clubId) => ({
        competitionId,
        clubId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        rank: 0,
      }))
    );
  }

  return true;
}

export async function getNextFixture(careerId: number) {
  const rows = await db
    .select({
      id: fixtures.id,
      scheduledDate: fixtures.scheduledDate,
      homeClubId: fixtures.homeClubId,
      awayClubId: fixtures.awayClubId,
      competitionId: fixtures.competitionId,
    })
    .from(fixtures)
    .where(
      and(eq(fixtures.careerId, careerId), eq(fixtures.resultStatus, "pending"))
    )
    .orderBy(asc(fixtures.scheduledDate))
    .limit(1);

  return rows[0] ?? null;
}

export async function simulateNextFixture(careerId: number) {
  const nextFixture = await getNextFixture(careerId);
  if (!nextFixture) {
    return null;
  }

  const result = await simulateFixture(nextFixture.id);
  await db
    .update(careers)
    .set({ currentDate: nextFixture.scheduledDate, updatedAt: new Date() })
    .where(eq(careers.id, careerId));

  await db.insert(inboxMessages).values({
    careerId,
    sentOn: nextFixture.scheduledDate,
    category: "competition",
    subject: "Fixture simulated",
    body: `Fixture ${nextFixture.id} was simulated.`,
    isRead: 0,
    actionPayloadJson: null,
  });

  return result;
}

export async function listUpcomingFixturesWithNames(
  careerId: number,
  limit = 5
) {
  const rows = await db
    .select({
      id: fixtures.id,
      scheduledDate: fixtures.scheduledDate,
      homeClubId: fixtures.homeClubId,
      awayClubId: fixtures.awayClubId,
      competitionId: fixtures.competitionId,
      resultStatus: fixtures.resultStatus,
    })
    .from(fixtures)
    .where(eq(fixtures.careerId, careerId))
    .orderBy(asc(fixtures.scheduledDate))
    .limit(limit);

  const ids = Array.from(
    new Set(rows.flatMap((row) => [row.homeClubId, row.awayClubId]))
  );

  const clubRows =
    ids.length === 0
      ? []
      : await db
          .select({ id: clubs.id, name: clubs.name })
          .from(clubs)
          .where(inArray(clubs.id, ids));

  const clubMap = new Map(clubRows.map((club) => [club.id, club.name]));

  return rows.map((row) => ({
    ...row,
    homeName: clubMap.get(row.homeClubId) ?? String(row.homeClubId),
    awayName: clubMap.get(row.awayClubId) ?? String(row.awayClubId),
  }));
}
