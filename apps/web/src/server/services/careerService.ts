import { eq } from "drizzle-orm";
import { db } from "../db";
import { careerClubState, careerRosters, careerSettings, careers, clubs, players } from "../db/schema";
import { createWelcomeMessage } from "./inboxService";

export async function createCareer(input: {
  name: string;
  managerProfileName: string;
  controlledClubId: number;
}) {
  const now = new Date();

  const careerRows = await db
    .insert(careers)
    .values({
      name: input.name,
      mode: "manager",
      managerProfileName: input.managerProfileName,
      controlledClubId: input.controlledClubId,
      currentDate: now,
      currentSeasonNumber: 1,
      status: "active",
      rngSeed: `seed-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: careers.id });

  const careerId = careerRows[0].id;

  await db.insert(careerSettings).values({
    careerId,
    currencySymbol: "£",
    boardStrictness: 2,
    transferDifficulty: 2,
    scoutingDifficulty: 2,
    enableFirstWindow: 1,
    enableInternationalManagement: 0,
    injuryFrequency: 2,
    playerGrowthSpeed: 2,
    autosaveEnabled: 1,
  });

  const clubStates = await db
    .select({
      clubId: clubs.id,
      transferBudgetDefault: clubs.transferBudgetDefault,
      wageBudgetDefault: clubs.wageBudgetDefault,
    })
    .from(clubs);

  await db.insert(careerClubState).values(
    clubStates.map((club) => ({
      careerId,
      clubId: club.clubId,
      transferBudget: club.transferBudgetDefault,
      wageBudget: club.wageBudgetDefault,
      weeklyWageSpend: Math.round(club.wageBudgetDefault / 8),
      youthScoutSlots: 1,
      transferScoutSlots: 2,
      managerRating: 70,
      moraleTeamAvg: 60,
      currentLeaguePosition: null,
    }))
  );

  const playerRows = await db
    .select({
      id: players.id,
      seedClubId: players.seedClubId,
    })
    .from(players);

  await db.insert(careerRosters).values(
    playerRows.map((player, index) => ({
      careerId,
      playerId: player.id,
      clubId: player.seedClubId,
      squadRole: "rotation",
      squadStatus: "senior",
      shirtNumber: (index % 30) + 1,
      joinedOn: now,
      contractEndDate: new Date(now.getUTCFullYear() + 3, 5, 30),
      releaseClause: null,
      isListedForLoan: 0,
      isListedForTransfer: 0,
      morale: 65,
      form: 60,
      sharpnessPlaceholder: null,
      fitness: 80,
      staminaModifier: 0,
      injuryStatus: "healthy",
      injuryType: null,
      injuryEndDate: null,
    }))
  );

  await createWelcomeMessage(careerId, now);

  return careerId;
}

export async function listCareers() {
  const rows = await db
    .select({
      id: careers.id,
      name: careers.name,
      managerProfileName: careers.managerProfileName,
      clubName: clubs.name,
      currentDate: careers.currentDate,
    })
    .from(careers)
    .leftJoin(clubs, eq(careers.controlledClubId, clubs.id));

  return rows.map((row) => ({
    ...row,
    currentDate:
      row.currentDate instanceof Date
        ? row.currentDate.toISOString().slice(0, 10)
        : String(row.currentDate),
  }));
}