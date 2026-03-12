import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dbPath, ensureDbDir } from "./paths";
import {
  careerClubState,
  careerCompetitions,
  careerRosters,
  careerSettings,
  careers,
  clubs,
  competitionTemplates,
  fixtures,
  inboxMessages,
  leagueTables,
  leagues,
  nations,
  players,
  positions,
} from "./schema";

const NOW = new Date("2025-07-01T00:00:00Z");

const nationSeed = [
  { name: "England", isoCode: "ENG" },
  { name: "Spain", isoCode: "ESP" },
];

const leagueSeed = [
  {
    name: "Premier League",
    nationIso: "ENG",
    tier: 1,
    isPlayable: true,
    prestige: 10,
    defaultCompetitionColor: "#2dd4ff",
  },
  {
    name: "LaLiga",
    nationIso: "ESP",
    tier: 1,
    isPlayable: true,
    prestige: 10,
    defaultCompetitionColor: "#f472b6",
  },
];

const premierClubs = [
  { name: "AFC Bournemouth", shortName: "Bournemouth" },
  { name: "Arsenal", shortName: "Arsenal" },
  { name: "Aston Villa", shortName: "Aston Villa" },
  { name: "Brentford", shortName: "Brentford" },
  { name: "Brighton & Hove Albion", shortName: "Brighton" },
  { name: "Burnley", shortName: "Burnley" },
  { name: "Chelsea", shortName: "Chelsea" },
  { name: "Crystal Palace", shortName: "Crystal Palace" },
  { name: "Everton", shortName: "Everton" },
  { name: "Fulham", shortName: "Fulham" },
  { name: "Leeds United", shortName: "Leeds" },
  { name: "Liverpool", shortName: "Liverpool" },
  { name: "Manchester City", shortName: "Man City" },
  { name: "Manchester United", shortName: "Man United" },
  { name: "Newcastle United", shortName: "Newcastle" },
  { name: "Nottingham Forest", shortName: "Nottingham Forest" },
  { name: "Sunderland", shortName: "Sunderland" },
  { name: "Tottenham Hotspur", shortName: "Tottenham" },
  { name: "West Ham United", shortName: "West Ham" },
  { name: "Wolverhampton Wanderers", shortName: "Wolves" },
];

const laligaClubs = [
  { name: "Athletic Club", shortName: "Athletic" },
  { name: "Atlético de Madrid", shortName: "Atlético" },
  { name: "CA Osasuna", shortName: "Osasuna" },
  { name: "Celta", shortName: "Celta" },
  { name: "Deportivo Alavés", shortName: "Alavés" },
  { name: "Elche CF", shortName: "Elche" },
  { name: "FC Barcelona", shortName: "Barcelona" },
  { name: "Getafe CF", shortName: "Getafe" },
  { name: "Girona FC", shortName: "Girona" },
  { name: "Levante UD", shortName: "Levante" },
  { name: "Rayo Vallecano", shortName: "Rayo Vallecano" },
  { name: "RCD Espanyol de Barcelona", shortName: "Espanyol" },
  { name: "RCD Mallorca", shortName: "Mallorca" },
  { name: "Real Betis", shortName: "Real Betis" },
  { name: "Real Madrid", shortName: "Real Madrid" },
  { name: "Real Oviedo", shortName: "Real Oviedo" },
  { name: "Real Sociedad", shortName: "Real Sociedad" },
  { name: "Sevilla FC", shortName: "Sevilla" },
  { name: "Valencia CF", shortName: "Valencia" },
  { name: "Villarreal CF", shortName: "Villarreal" },
];

const elitePremier = new Set([
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Tottenham Hotspur",
]);

const eliteLaLiga = new Set([
  "FC Barcelona",
  "Real Madrid",
  "Atlético de Madrid",
  "Real Sociedad",
  "Villarreal CF",
  "Real Betis",
]);

function buildClubSeed() {
  const basePrimary = "#0f172a";
  const baseSecondary = "#38bdf8";
  const laligaPrimary = "#111827";
  const laligaSecondary = "#f59e0b";

  const build = (
    entry: { name: string; shortName: string },
    leagueName: string,
    nationIso: string,
    eliteSet: Set<string>,
    primary: string,
    secondary: string
  ) => {
    const isElite = eliteSet.has(entry.name);
    const attackRating = isElite ? 86 : 78;
    const midfieldRating = isElite ? 85 : 77;
    const defenseRating = isElite ? 84 : 76;
    const prestige = isElite ? 9 : 7;
    const transferBudgetDefault = isElite ? 120000000 : 45000000;
    const wageBudgetDefault = isElite ? 3000000 : 1200000;

    return {
      name: entry.name,
      shortName: entry.shortName,
      nationIso,
      leagueName,
      prestige,
      attackRating,
      midfieldRating,
      defenseRating,
      transferBudgetDefault,
      wageBudgetDefault,
      stadiumName: `${entry.shortName} Stadium`,
      primaryColor: primary,
      secondaryColor: secondary,
    };
  };

  const premier = premierClubs.map((club) =>
    build(club, "Premier League", "ENG", elitePremier, basePrimary, baseSecondary)
  );
  const laliga = laligaClubs.map((club) =>
    build(club, "LaLiga", "ESP", eliteLaLiga, laligaPrimary, laligaSecondary)
  );

  return [...premier, ...laliga];
}

const clubSeed = buildClubSeed();

const positionSeed = [
  { code: "GK", name: "Goalkeeper", sortOrder: 1 },
  { code: "RB", name: "Right Back", sortOrder: 2 },
  { code: "CB", name: "Center Back", sortOrder: 3 },
  { code: "LB", name: "Left Back", sortOrder: 4 },
  { code: "CDM", name: "Defensive Midfielder", sortOrder: 5 },
  { code: "CM", name: "Central Midfielder", sortOrder: 6 },
  { code: "CAM", name: "Attacking Midfielder", sortOrder: 7 },
  { code: "RW", name: "Right Winger", sortOrder: 8 },
  { code: "LW", name: "Left Winger", sortOrder: 9 },
  { code: "ST", name: "Striker", sortOrder: 10 },
];

const competitionTemplateSeed = [
  {
    name: "Premier League",
    type: "league",
    nationIso: "ENG",
    leagueName: "Premier League",
    fixtureRulesJson: JSON.stringify({ rounds: 38, teams: 20 }),
    prizeRulesJson: JSON.stringify({ champion: 60000000, top4: 35000000 }),
  },
  {
    name: "LaLiga",
    type: "league",
    nationIso: "ESP",
    leagueName: "LaLiga",
    fixtureRulesJson: JSON.stringify({ rounds: 38, teams: 20 }),
    prizeRulesJson: JSON.stringify({ champion: 52000000, top4: 28000000 }),
  },
];

const firstNames = [
  "Alex",
  "Jordan",
  "Luis",
  "Marco",
  "Rafael",
  "Ethan",
  "Noah",
  "Diego",
  "Mateo",
  "Hugo",
  "Liam",
  "Owen",
];

const lastNames = [
  "Parker",
  "Santos",
  "Herrera",
  "Navarro",
  "Silva",
  "Reed",
  "Walker",
  "Brooks",
  "Castillo",
  "Mendes",
  "Lopez",
  "Gray",
];

const positionCycle = [
  "GK",
  "RB",
  "CB",
  "CB",
  "LB",
  "CDM",
  "CM",
  "CM",
  "CAM",
  "RW",
  "LW",
  "ST",
  "ST",
  "RB",
  "CB",
  "LB",
  "CM",
  "CAM",
  "RW",
  "LW",
  "ST",
  "GK",
];

function buildPlayers(clubRows: Array<{ id: number; name: string; nationId: number; prestige: number }>) {
  const playersToInsert: Array<{
    firstName: string;
    lastName: string;
    commonName: string | null;
    nationalityId: number;
    birthDate: Date;
    preferredFoot: string;
    heightCm: number;
    weightKg: number;
    potential: number;
    overall: number;
    primaryPosition: string;
    secondaryPositionsJson: string;
    valueAmount: number;
    wageAmount: number;
    faceAssetKey: string | null;
    bodyType: string;
    isRealPlayer: number;
    createdFrom: string;
    seedClubId: number;
  }> = [];

  clubRows.forEach((club, clubIndex) => {
    const baseOverall = 65 + club.prestige * 2;
    for (let i = 0; i < 22; i += 1) {
      const firstName = firstNames[(clubIndex + i) % firstNames.length];
      const lastName = lastNames[(clubIndex + i * 2) % lastNames.length];
      const overall = Math.min(90, baseOverall + (i % 5));
      const potential = Math.min(92, overall + 4);
      const position = positionCycle[i % positionCycle.length];
      playersToInsert.push({
        firstName,
        lastName,
        commonName: null,
        nationalityId: club.nationId,
        birthDate: new Date(1994 + (i % 8), 5, 15),
        preferredFoot: i % 3 === 0 ? "left" : "right",
        heightCm: 172 + (i % 12),
        weightKg: 68 + (i % 10),
        potential,
        overall,
        primaryPosition: position,
        secondaryPositionsJson: JSON.stringify([]),
        valueAmount: overall * 90000,
        wageAmount: overall * 2500,
        faceAssetKey: null,
        bodyType: "lean",
        isRealPlayer: 0,
        createdFrom: "seed",
        seedClubId: club.id,
      });
    }
  });

  return playersToInsert;
}

async function main() {
  ensureDbDir();
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  await db.delete(leagueTables);
  await db.delete(fixtures);
  await db.delete(careerCompetitions);
  await db.delete(inboxMessages);
  await db.delete(careerRosters);
  await db.delete(careerClubState);
  await db.delete(careerSettings);
  await db.delete(careers);
  await db.delete(players);
  await db.delete(competitionTemplates);
  await db.delete(positions);
  await db.delete(clubs);
  await db.delete(leagues);
  await db.delete(nations);

  const nationRows = await db
    .insert(nations)
    .values(nationSeed)
    .returning({ id: nations.id, isoCode: nations.isoCode });

  const nationMap = new Map(nationRows.map((row) => [row.isoCode, row.id]));

  const leagueRows = await db
    .insert(leagues)
    .values(
      leagueSeed.map((league) => ({
        name: league.name,
        nationId: nationMap.get(league.nationIso)!,
        tier: league.tier,
        isPlayable: league.isPlayable,
        prestige: league.prestige,
        defaultCompetitionColor: league.defaultCompetitionColor,
      }))
    )
    .returning({ id: leagues.id, name: leagues.name });

  const leagueMap = new Map(leagueRows.map((row) => [row.name, row.id]));

  await db.insert(clubs).values(
    clubSeed.map((club) => ({
      name: club.name,
      shortName: club.shortName,
      nationId: nationMap.get(club.nationIso)!,
      leagueId: leagueMap.get(club.leagueName)!,
      rivalClubId: null,
      prestige: club.prestige,
      attackRating: club.attackRating,
      midfieldRating: club.midfieldRating,
      defenseRating: club.defenseRating,
      transferBudgetDefault: club.transferBudgetDefault,
      wageBudgetDefault: club.wageBudgetDefault,
      stadiumName: club.stadiumName,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
    }))
  );

  await db.insert(positions).values(positionSeed);

  await db.insert(competitionTemplates).values(
    competitionTemplateSeed.map((template) => ({
      name: template.name,
      type: template.type,
      nationId: nationMap.get(template.nationIso)!,
      leagueId: leagueMap.get(template.leagueName)!,
      fixtureRulesJson: template.fixtureRulesJson,
      prizeRulesJson: template.prizeRulesJson,
    }))
  );

  const clubRows = await db
    .select({ id: clubs.id, name: clubs.name, nationId: clubs.nationId, prestige: clubs.prestige })
    .from(clubs);

  const playersToInsert = buildPlayers(clubRows);
  const playerRows = await db.insert(players).values(playersToInsert).returning({
    id: players.id,
    seedClubId: players.seedClubId,
  });

  const demoCareerRows = await db
    .insert(careers)
    .values({
      name: "Demo Career",
      mode: "manager",
      managerProfileName: "Alex Hunter",
      controlledClubId: clubRows[0].id,
      currentDate: NOW,
      currentSeasonNumber: 1,
      status: "active",
      rngSeed: "seed-001",
      createdAt: NOW,
      updatedAt: NOW,
    })
    .returning({ id: careers.id });

  const careerId = demoCareerRows[0].id;

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

  await db.insert(inboxMessages).values({
    careerId,
    sentOn: NOW,
    category: "board",
    subject: "Welcome to the club",
    body: "Board expectations set. Your first objectives will arrive shortly.",
    isRead: 0,
    actionPayloadJson: null,
  });

  await db.insert(careerRosters).values(
    playerRows.map((player, index) => ({
      careerId,
      playerId: player.id,
      clubId: player.seedClubId,
      squadRole: "rotation",
      squadStatus: "senior",
      shirtNumber: (index % 30) + 1,
      joinedOn: NOW,
      contractEndDate: new Date(2028, 5, 30),
      releaseClause: null,
      isListedForLoan: 0,
      isListedForTransfer: 0,
      morale: 60 + (index % 20),
      form: 55 + (index % 15),
      sharpnessPlaceholder: null,
      fitness: 75 + (index % 20),
      staminaModifier: 0,
      injuryStatus: "healthy",
      injuryType: null,
      injuryEndDate: null,
    }))
  );

  await db.insert(careerClubState).values(
    clubRows.map((club) => ({
      careerId,
      clubId: club.id,
      transferBudget: club.prestige >= 9 ? 120000000 : 45000000,
      wageBudget: club.prestige >= 9 ? 3000000 : 1200000,
      weeklyWageSpend: club.prestige >= 9 ? 1800000 : 600000,
      youthScoutSlots: 1,
      transferScoutSlots: 2,
      managerRating: 68,
      moraleTeamAvg: 60,
      currentLeaguePosition: null,
    }))
  );

  sqlite.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});