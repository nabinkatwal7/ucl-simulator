import { eq } from "drizzle-orm";
import { db } from "../db";
import { clubs, fixtures, leagueTables } from "../db/schema";

function samplePoisson(lambda: number) {
  const L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;

  do {
    k += 1;
    p *= Math.random();
  } while (p > L && k < 10);

  return Math.max(0, k - 1);
}

export async function simulateFixture(fixtureId: number) {
  const fixtureRows = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.id, fixtureId));

  if (fixtureRows.length === 0) {
    return null;
  }

  const fixture = fixtureRows[0];

  if (fixture.resultStatus !== "pending") {
    return fixture;
  }

  const clubRows = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, fixture.homeClubId));
  const awayRows = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, fixture.awayClubId));

  if (clubRows.length === 0 || awayRows.length === 0) {
    return null;
  }

  const home = clubRows[0];
  const away = awayRows[0];

  const homeStrength = (home.attackRating + home.midfieldRating + home.defenseRating) / 3;
  const awayStrength = (away.attackRating + away.midfieldRating + away.defenseRating) / 3;

  const expectedHome = Math.max(0.4, 1.35 + (homeStrength - away.defenseRating) / 50 + 0.2);
  const expectedAway = Math.max(0.3, 1.05 + (awayStrength - home.defenseRating) / 50);

  const homeGoals = samplePoisson(expectedHome);
  const awayGoals = samplePoisson(expectedAway);

  await db
    .update(fixtures)
    .set({
      resultStatus: "simulated",
      homeGoals,
      awayGoals,
      extraTimeUsed: 0,
      penaltiesUsed: 0,
      winnerClubId: homeGoals === awayGoals ? null : homeGoals > awayGoals ? home.id : away.id,
    })
    .where(eq(fixtures.id, fixtureId));

  const tableRows = await db
    .select()
    .from(leagueTables)
    .where(eq(leagueTables.competitionId, fixture.competitionId));

  const homeTable = tableRows.find((row) => row.clubId === home.id);
  const awayTable = tableRows.find((row) => row.clubId === away.id);

  if (!homeTable || !awayTable) {
    return null;
  }

  const homeWin = homeGoals > awayGoals;
  const draw = homeGoals === awayGoals;
  const awayWin = awayGoals > homeGoals;

  const nextHome = {
    played: homeTable.played + 1,
    wins: homeTable.wins + (homeWin ? 1 : 0),
    draws: homeTable.draws + (draw ? 1 : 0),
    losses: homeTable.losses + (awayWin ? 1 : 0),
    goalsFor: homeTable.goalsFor + homeGoals,
    goalsAgainst: homeTable.goalsAgainst + awayGoals,
  };
  const nextAway = {
    played: awayTable.played + 1,
    wins: awayTable.wins + (awayWin ? 1 : 0),
    draws: awayTable.draws + (draw ? 1 : 0),
    losses: awayTable.losses + (homeWin ? 1 : 0),
    goalsFor: awayTable.goalsFor + awayGoals,
    goalsAgainst: awayTable.goalsAgainst + homeGoals,
  };

  const homePoints = nextHome.wins * 3 + nextHome.draws;
  const awayPoints = nextAway.wins * 3 + nextAway.draws;

  await db
    .update(leagueTables)
    .set({
      ...nextHome,
      goalDifference: nextHome.goalsFor - nextHome.goalsAgainst,
      points: homePoints,
    })
    .where(eq(leagueTables.id, homeTable.id));

  await db
    .update(leagueTables)
    .set({
      ...nextAway,
      goalDifference: nextAway.goalsFor - nextAway.goalsAgainst,
      points: awayPoints,
    })
    .where(eq(leagueTables.id, awayTable.id));

  const updated = await db
    .select()
    .from(leagueTables)
    .where(eq(leagueTables.competitionId, fixture.competitionId));

  const sorted = [...updated].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  for (let i = 0; i < sorted.length; i += 1) {
    await db
      .update(leagueTables)
      .set({ rank: i + 1 })
      .where(eq(leagueTables.id, sorted[i].id));
  }

  return { fixtureId, homeGoals, awayGoals };
}