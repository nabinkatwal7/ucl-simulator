import { STEP_LABELS } from "@/lib/models/constants";
import type {
  Awards,
  Club,
  ClubSeasonStat,
  KnockoutLeg,
  KnockoutTie,
  LeagueFixture,
  MatchEvent,
  MatchResult,
  MatchStage,
  Player,
  PlayerSeasonStat,
  Season,
  TournamentStep,
  UniverseDB,
} from "@/lib/models/types";

class RNG {
  constructor(private seed: number) {}

  next() {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const clone = [...items];
    for (let index = clone.length - 1; index > 0; index -= 1) {
      const swapIndex = this.int(0, index);
      [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
    }
    return clone;
  }

  weightedPick<T>(items: T[], getWeight: (item: T) => number): T {
    const total = items.reduce(
      (sum, item) => sum + Math.max(0.01, getWeight(item)),
      0
    );
    let cursor = this.next() * total;
    for (const item of items) {
      cursor -= Math.max(0.01, getWeight(item));
      if (cursor <= 0) {
        return item;
      }
    }
    return items[items.length - 1];
  }

  finalize() {
    return this.seed;
  }
}

function nextId(db: UniverseDB, prefix: string) {
  db.meta.nextId += 1;
  return `${prefix}-${db.meta.nextId}`;
}

function getCurrentSeason(db: UniverseDB) {
  return db.seasons.find((season) => season.id === db.meta.currentSeasonId);
}

function clubMap(db: UniverseDB) {
  return new Map(db.clubs.map((club) => [club.id, club]));
}

function playerMap(db: UniverseDB) {
  return new Map(db.players.map((player) => [player.id, player]));
}

function statMap(db: UniverseDB, seasonId: string) {
  return new Map(
    db.clubStats
      .filter((entry) => entry.seasonId === seasonId)
      .map((entry) => [entry.clubId, entry])
  );
}

function playerStatMap(db: UniverseDB, seasonId: string) {
  return new Map(
    db.playerStats
      .filter((entry) => entry.seasonId === seasonId)
      .map((entry) => [entry.playerId, entry])
  );
}

function expectedGoals(
  home: Club,
  away: Club,
  homeAdvantage = 2,
  intensity = 1
) {
  const strengthEdge =
    (home.attackRating +
      home.midfieldRating +
      home.rating +
      homeAdvantage -
      away.defenseRating -
      away.goalkeeperRating) /
    52;
  return Math.min(3.8, Math.max(0.25, (1.2 + strengthEdge) * intensity));
}

function poisson(rng: RNG, lambda: number) {
  const limit = Math.exp(-Math.max(0.1, lambda));
  let product = 1;
  let goals = 0;
  while (product > limit) {
    product *= rng.next();
    goals += 1;
  }
  return goals - 1;
}

function getSquad(db: UniverseDB, clubId: string) {
  return db.players
    .filter((player) => player.clubId === clubId && !player.retired)
    .toSorted((a, b) => b.rating - a.rating)
    .slice(0, 18);
}

function chooseLineupPlayers(squad: Player[], position: Player["position"]) {
  return squad.filter((player) => player.position === position);
}

function weightedScorer(rng: RNG, squad: Player[]) {
  return rng.weightedPick(squad, (player) => {
    const base =
      player.position === "FWD"
        ? 6
        : player.position === "MID"
        ? 3
        : player.position === "DEF"
        ? 1.3
        : 0.4;
    return base + player.rating / 25 + player.roleImportance;
  });
}

function weightedAssist(rng: RNG, squad: Player[], scorerId: string) {
  const candidates = squad.filter(
    (player) => player.id !== scorerId && player.position !== "GK"
  );
  if (candidates.length === 0) {
    return undefined;
  }
  return rng.weightedPick(candidates, (player) => {
    const base =
      player.position === "MID" ? 4 : player.position === "FWD" ? 2.5 : 1.2;
    return base + player.rating / 30;
  });
}

function updateForm(stat: ClubSeasonStat, result: "W" | "D" | "L") {
  stat.form = [result, ...stat.form].slice(0, 5);
}

function getStandingRows(db: UniverseDB, seasonId: string, clubIds: string[]) {
  const clubs = clubMap(db);
  const stats = db.clubStats.filter(
    (entry) => entry.seasonId === seasonId && clubIds.includes(entry.clubId)
  );
  return stats.toSorted((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    const rightGd = right.goalsFor - right.goalsAgainst;
    const leftGd = left.goalsFor - left.goalsAgainst;
    if (rightGd !== leftGd) return rightGd - leftGd;
    if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
    return (
      (clubs.get(right.clubId)?.rating ?? 0) -
      (clubs.get(left.clubId)?.rating ?? 0)
    );
  });
}

function syncSeasonMatches(db: UniverseDB, season: Season) {
  const seasonMatches = [
    ...season.leagueFixtures,
    ...season.playoffTies.flatMap((tie) => tie.legs),
    ...season.ro16Ties.flatMap((tie) => tie.legs),
    ...season.quarterfinalTies.flatMap((tie) => tie.legs),
    ...season.semifinalTies.flatMap((tie) => tie.legs),
    ...(season.finalMatch ? [season.finalMatch] : []),
  ];
  db.matches = db.matches
    .filter((match) => match.seasonId !== season.id)
    .concat(seasonMatches);
}
function createClubStats(db: UniverseDB, seasonId: string, clubIds: string[]) {
  const stats: ClubSeasonStat[] = clubIds.map((clubId) => ({
    id: nextId(db, "clubstat"),
    seasonId,
    clubId,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    cleanSheets: 0,
    form: [],
    homeWins: 0,
    homeDraws: 0,
    homeLosses: 0,
    awayWins: 0,
    awayDraws: 0,
    awayLosses: 0,
    played: 0,
  }));
  db.clubStats.push(...stats);
}

function createPlayerStats(
  db: UniverseDB,
  seasonId: string,
  clubIds: string[]
) {
  const stats: PlayerSeasonStat[] = db.players
    .filter((player) => clubIds.includes(player.clubId) && !player.retired)
    .map((player) => ({
      id: nextId(db, "playerstat"),
      seasonId,
      playerId: player.id,
      clubId: player.clubId,
      goals: 0,
      assists: 0,
      appearances: 0,
      minutes: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      manOfTheMatch: 0,
    }));
  db.playerStats.push(...stats);
}

function seasonLabel(season: Season) {
  return `${season.yearStart}/${String(season.yearEnd).slice(-2)}`;
}

function tierWeight(club: Club) {
  switch (club.tier) {
    case "elite":
      return 1.28;
    case "strong":
      return 1.12;
    case "contender":
      return 0.94;
    case "outsider":
      return 0.78;
  }
}

function evolveUniverse(db: UniverseDB, season: Season, rng: RNG) {
  for (const club of db.clubs) {
    const qualified = season.qualifiedClubIds.includes(club.id);
    const successBoost =
      club.id === season.championClubId
        ? 1.2
        : club.id === season.runnerUpClubId
        ? 0.8
        : qualified
        ? 0.25
        : -0.1;
    const randomDrift = (rng.next() - 0.5) * 1.4;
    club.rating = Math.max(
      66,
      Math.min(97, club.rating + successBoost + randomDrift)
    );
    club.attackRating = Math.max(
      64,
      Math.min(98, club.attackRating + (rng.next() - 0.45) + successBoost * 0.4)
    );
    club.defenseRating = Math.max(
      64,
      Math.min(
        98,
        club.defenseRating + (rng.next() - 0.55) + successBoost * 0.3
      )
    );
    club.midfieldRating = Math.max(
      64,
      Math.min(
        98,
        club.midfieldRating + (rng.next() - 0.5) + successBoost * 0.25
      )
    );
    club.goalkeeperRating = Math.max(
      63,
      Math.min(
        97,
        club.goalkeeperRating + (rng.next() - 0.5) + successBoost * 0.15
      )
    );
  }

  const clubs = clubMap(db);
  for (const player of db.players) {
    if (player.retired) continue;
    player.age += 1;
    const club = clubs.get(player.clubId);
    const ageEffect = player.age < 25 ? 0.8 : player.age > 31 ? -0.9 : 0.15;
    const clubEffect = club ? (club.rating - player.rating) / 35 : 0;
    player.rating = Math.max(
      58,
      Math.min(96, player.rating + ageEffect + clubEffect + (rng.next() - 0.5))
    );
    if (player.age > 35 && rng.next() > 0.45) {
      player.retired = true;
    }
  }

  for (const club of db.clubs) {
    const activeCount = db.players.filter(
      (player) => player.clubId === club.id && !player.retired
    ).length;
    for (let index = activeCount; index < 20; index += 1) {
      db.players.push({
        id: nextId(db, "player"),
        name: `Academy ${club.logo} ${index + 1}`,
        age: 18 + (index % 3),
        nationality: club.country,
        position:
          index < 2 ? "GK" : index < 8 ? "DEF" : index < 14 ? "MID" : "FWD",
        rating: Math.max(60, club.rating - 9 + (index % 5)),
        clubId: club.id,
        roleImportance: Math.max(1, 4 - (index % 4)),
      });
    }
  }
}

function updateRecords(db: UniverseDB) {
  db.records.mostTitlesClubIds = db.clubs
    .toSorted((a, b) => b.titles - a.titles)
    .slice(0, 5)
    .map((club) => club.id);
  db.records.mostFinalsClubIds = db.clubs
    .toSorted((a, b) => b.finals - a.finals)
    .slice(0, 5)
    .map((club) => club.id);
  const aggregate = new Map<string, PlayerSeasonStat>();
  for (const stat of db.playerStats) {
    const current = aggregate.get(stat.playerId);
    if (current) {
      current.goals += stat.goals;
      current.assists += stat.assists;
      current.cleanSheets += stat.cleanSheets;
    } else {
      aggregate.set(stat.playerId, { ...stat });
    }
  }
  const values = [...aggregate.values()];
  db.records.mostGoalsPlayerIds = values
    .toSorted((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((entry) => entry.playerId);
  db.records.mostAssistsPlayerIds = values
    .toSorted((a, b) => b.assists - a.assists)
    .slice(0, 10)
    .map((entry) => entry.playerId);
  db.records.mostCleanSheetsPlayerIds = values
    .toSorted((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 10)
    .map((entry) => entry.playerId);
}

function headlineForFixture(home: Club, away: Club, result: MatchResult) {
  if (
    home.rating - away.rating < -8 &&
    (result.homeGoals ?? 0) > (result.awayGoals ?? 0)
  )
    return `${home.name} stun ${away.name} in a statement night`;
  if (
    away.rating - home.rating < -8 &&
    (result.awayGoals ?? 0) > (result.homeGoals ?? 0)
  )
    return `${away.name} flip the script away from home`;
  if ((result.homeGoals ?? 0) + (result.awayGoals ?? 0) >= 6)
    return `${home.name} and ${away.name} trade blows in a thriller`;
  return `${home.name} edge ${away.name} as the table takes shape`;
}

function simulateMatch(
  db: UniverseDB,
  season: Season,
  stage: MatchStage,
  homeClubId: string,
  awayClubId: string,
  rng: RNG,
  context: {
    matchday?: number;
    leg?: 1 | 2;
    homeAdvantage?: number;
    id: string;
  }
): MatchResult {
  const clubs = clubMap(db);
  const players = playerMap(db);
  const playerStats = playerStatMap(db, season.id);
  const clubStats = statMap(db, season.id);
  const home = clubs.get(homeClubId)!;
  const away = clubs.get(awayClubId)!;
  const homeSquad = getSquad(db, homeClubId);
  const awaySquad = getSquad(db, awayClubId);
  const intensity = stage === "league" ? 1 : stage === "final" ? 1.02 : 1.06;
  const homeGoals = poisson(
    rng,
    expectedGoals(home, away, context.homeAdvantage ?? 2, intensity)
  );
  const awayGoals = poisson(
    rng,
    expectedGoals(away, home, 0, intensity - 0.06)
  );
  const events: MatchEvent[] = [];

  for (let index = 0; index < homeGoals; index += 1) {
    const scorer = weightedScorer(rng, homeSquad);
    const assist =
      rng.next() > 0.32 ? weightedAssist(rng, homeSquad, scorer.id) : undefined;
    events.push({
      minute: rng.int(4, 90),
      type: "goal",
      clubId: homeClubId,
      playerId: scorer.id,
      assistPlayerId: assist?.id,
    });
  }
  for (let index = 0; index < awayGoals; index += 1) {
    const scorer = weightedScorer(rng, awaySquad);
    const assist =
      rng.next() > 0.35 ? weightedAssist(rng, awaySquad, scorer.id) : undefined;
    events.push({
      minute: rng.int(4, 90),
      type: "goal",
      clubId: awayClubId,
      playerId: scorer.id,
      assistPlayerId: assist?.id,
    });
  }

  const cardCandidates = [
    ...homeSquad.slice(0, 11),
    ...awaySquad.slice(0, 11),
  ].filter((player) => player.position !== "GK");
  for (let index = 0; index < rng.int(1, 6); index += 1) {
    const offender = rng.pick(cardCandidates);
    events.push({
      minute: rng.int(8, 89),
      type: "yellow",
      clubId: offender.clubId,
      playerId: offender.id,
    });
  }
  if (rng.next() > 0.88) {
    const offender = rng.pick(cardCandidates);
    events.push({
      minute: rng.int(20, 88),
      type: "red",
      clubId: offender.clubId,
      playerId: offender.id,
    });
  }

  for (const player of [...homeSquad.slice(0, 11), ...awaySquad.slice(0, 11)]) {
    const stat = playerStats.get(player.id);
    if (!stat) continue;
    stat.appearances += 1;
    stat.minutes += 90;
  }

  for (const event of events) {
    const stat = playerStats.get(event.playerId);
    if (!stat) continue;
    if (event.type === "goal") stat.goals += 1;
    if (event.type === "yellow") stat.yellowCards += 1;
    if (event.type === "red") stat.redCards += 1;
    if (event.assistPlayerId) {
      const assistStat = playerStats.get(event.assistPlayerId);
      if (assistStat) assistStat.assists += 1;
    }
  }

  const homeStat = clubStats.get(homeClubId)!;
  const awayStat = clubStats.get(awayClubId)!;
  homeStat.played += 1;
  awayStat.played += 1;
  homeStat.goalsFor += homeGoals;
  homeStat.goalsAgainst += awayGoals;
  awayStat.goalsFor += awayGoals;
  awayStat.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    homeStat.wins += 1;
    awayStat.losses += 1;
    homeStat.homeWins += 1;
    awayStat.awayLosses += 1;
    if (stage === "league") homeStat.points += 3;
    updateForm(homeStat, "W");
    updateForm(awayStat, "L");
  } else if (awayGoals > homeGoals) {
    awayStat.wins += 1;
    homeStat.losses += 1;
    awayStat.awayWins += 1;
    homeStat.homeLosses += 1;
    if (stage === "league") awayStat.points += 3;
    updateForm(homeStat, "L");
    updateForm(awayStat, "W");
  } else {
    homeStat.draws += 1;
    awayStat.draws += 1;
    homeStat.homeDraws += 1;
    awayStat.awayDraws += 1;
    if (stage === "league") {
      homeStat.points += 1;
      awayStat.points += 1;
    }
    updateForm(homeStat, "D");
    updateForm(awayStat, "D");
  }

  if (awayGoals === 0) {
    homeStat.cleanSheets += 1;
    const keeper = chooseLineupPlayers(homeSquad, "GK")[0];
    const keeperStat = keeper ? playerStats.get(keeper.id) : undefined;
    if (keeperStat) keeperStat.cleanSheets += 1;
  }
  if (homeGoals === 0) {
    awayStat.cleanSheets += 1;
    const keeper = chooseLineupPlayers(awaySquad, "GK")[0];
    const keeperStat = keeper ? playerStats.get(keeper.id) : undefined;
    if (keeperStat) keeperStat.cleanSheets += 1;
  }

  const motmCandidates = events
    .filter((event) => event.type === "goal")
    .map((event) => players.get(event.playerId))
    .filter((entry): entry is Player => Boolean(entry));
  const manOfTheMatch =
    motmCandidates[0] ??
    [...homeSquad, ...awaySquad].toSorted((a, b) => b.rating - a.rating)[0];
  const motmStat = manOfTheMatch
    ? playerStats.get(manOfTheMatch.id)
    : undefined;
  if (motmStat) motmStat.manOfTheMatch += 1;

  return {
    id: context.id,
    seasonId: season.id,
    stage,
    homeClubId,
    awayClubId,
    homeGoals,
    awayGoals,
    extraTime: false,
    penalties: false,
    matchday: context.matchday,
    leg: context.leg,
    winnerClubId:
      homeGoals === awayGoals
        ? undefined
        : homeGoals > awayGoals
        ? homeClubId
        : awayClubId,
    events: events.toSorted((a, b) => a.minute - b.minute),
    manOfTheMatchPlayerId: manOfTheMatch?.id,
    shots: {
      home: rng.int(7, 18) + homeGoals * 2,
      away: rng.int(5, 16) + awayGoals * 2,
    },
    xg: {
      home: Number((homeGoals + rng.next() * 1.4).toFixed(2)),
      away: Number((awayGoals + rng.next() * 1.2).toFixed(2)),
    },
    possession: { home: rng.int(43, 62), away: 0 },
    corners: { home: rng.int(2, 9), away: rng.int(2, 9) },
    fouls: { home: rng.int(7, 15), away: rng.int(7, 15) },
  };
}

function ensurePossession(result: MatchResult) {
  if (result.possession) result.possession.away = 100 - result.possession.home;
  return result;
}
function buildLeagueRound(
  remaining: string[],
  seen: Map<string, Set<string>>,
  homeCounts: Map<string, number>,
  awayCounts: Map<string, number>,
  rng: RNG
): [string, string][] | null {
  if (remaining.length === 0) return [];
  const [clubId, ...rest] = remaining;
  const candidates = rng
    .shuffle(rest)
    .filter((other) => !seen.get(clubId)?.has(other));
  for (const other of candidates) {
    const orientations: [string, string][] = [];
    if ((homeCounts.get(clubId) ?? 0) < 4 && (awayCounts.get(other) ?? 0) < 4)
      orientations.push([clubId, other]);
    if ((homeCounts.get(other) ?? 0) < 4 && (awayCounts.get(clubId) ?? 0) < 4)
      orientations.push([other, clubId]);
    for (const [homeId, awayId] of rng.shuffle(orientations)) {
      seen.get(homeId)?.add(awayId);
      seen.get(awayId)?.add(homeId);
      homeCounts.set(homeId, (homeCounts.get(homeId) ?? 0) + 1);
      awayCounts.set(awayId, (awayCounts.get(awayId) ?? 0) + 1);
      const deeper = buildLeagueRound(
        rest.filter((item) => item !== other),
        seen,
        homeCounts,
        awayCounts,
        rng
      );
      if (deeper) return [[homeId, awayId], ...deeper];
      seen.get(homeId)?.delete(awayId);
      seen.get(awayId)?.delete(homeId);
      homeCounts.set(homeId, (homeCounts.get(homeId) ?? 1) - 1);
      awayCounts.set(awayId, (awayCounts.get(awayId) ?? 1) - 1);
    }
  }
  return null;
}

function generateLeagueFixtures(db: UniverseDB, season: Season, rng: RNG) {
  const clubIds = season.qualifiedClubIds;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const seen = new Map(clubIds.map((id) => [id, new Set<string>()]));
    const homeCounts = new Map(clubIds.map((id) => [id, 0]));
    const awayCounts = new Map(clubIds.map((id) => [id, 0]));
    const fixtures: LeagueFixture[] = [];
    let valid = true;
    for (let matchday = 1; matchday <= 8; matchday += 1) {
      const pairings = buildLeagueRound(
        rng.shuffle(clubIds),
        seen,
        homeCounts,
        awayCounts,
        rng
      );
      if (!pairings) {
        valid = false;
        break;
      }
      fixtures.push(
        ...pairings.map(([homeClubId, awayClubId], index) => ({
          id: nextId(db, `match-${season.id}-${matchday}-${index + 1}`),
          seasonId: season.id,
          stage: "league" as const,
          homeClubId,
          awayClubId,
          homeGoals: null,
          awayGoals: null,
          extraTime: false,
          penalties: false,
          winnerClubId: undefined,
          matchday,
          events: [],
        }))
      );
    }
    if (valid) return fixtures;
  }
  throw new Error("Could not generate league fixtures.");
}

function createTwoLeggedTies(
  db: UniverseDB,
  seasonId: string,
  stage: KnockoutTie["stage"],
  pairs: [string, string][],
  secondLegHosts: Set<string>
) {
  return pairs.map(([clubAId, clubBId], index) => {
    const hostSecond = secondLegHosts.has(clubAId);
    const firstHome = hostSecond ? clubBId : clubAId;
    const firstAway = hostSecond ? clubAId : clubBId;
    const secondHome = hostSecond ? clubAId : clubBId;
    const secondAway = hostSecond ? clubBId : clubAId;
    return {
      id: `${stage}-${index + 1}`,
      stage,
      clubAId,
      clubBId,
      legs: [
        {
          id: nextId(db, `match-${stage}-1`),
          seasonId,
          stage,
          homeClubId: firstHome,
          awayClubId: firstAway,
          homeGoals: null,
          awayGoals: null,
          extraTime: false,
          penalties: false,
          leg: 1 as const,
          events: [],
        },
        {
          id: nextId(db, `match-${stage}-2`),
          seasonId,
          stage,
          homeClubId: secondHome,
          awayClubId: secondAway,
          homeGoals: null,
          awayGoals: null,
          extraTime: false,
          penalties: false,
          leg: 2 as const,
          events: [],
        },
      ],
    } satisfies KnockoutTie;
  });
}

function resolveSecondLeg(
  db: UniverseDB,
  season: Season,
  tie: KnockoutTie,
  rng: RNG
) {
  const [firstLeg, secondLeg] = tie.legs;
  const regular = ensurePossession(
    simulateMatch(
      db,
      season,
      tie.stage,
      secondLeg.homeClubId,
      secondLeg.awayClubId,
      rng,
      { id: secondLeg.id, leg: 2 }
    )
  );
  const aggregateHome =
    (firstLeg.homeClubId === secondLeg.homeClubId
      ? firstLeg.homeGoals ?? 0
      : firstLeg.awayGoals ?? 0) + (regular.homeGoals ?? 0);
  const aggregateAway =
    (firstLeg.homeClubId === secondLeg.awayClubId
      ? firstLeg.homeGoals ?? 0
      : firstLeg.awayGoals ?? 0) + (regular.awayGoals ?? 0);
  let winnerClubId =
    aggregateHome > aggregateAway
      ? secondLeg.homeClubId
      : aggregateAway > aggregateHome
      ? secondLeg.awayClubId
      : undefined;
  if (!winnerClubId) {
    regular.extraTime = true;
    regular.homeGoals = (regular.homeGoals ?? 0) + poisson(rng, 0.28);
    regular.awayGoals = (regular.awayGoals ?? 0) + poisson(rng, 0.24);
    const postExtraHome =
      (firstLeg.homeClubId === secondLeg.homeClubId
        ? firstLeg.homeGoals ?? 0
        : firstLeg.awayGoals ?? 0) + (regular.homeGoals ?? 0);
    const postExtraAway =
      (firstLeg.homeClubId === secondLeg.awayClubId
        ? firstLeg.homeGoals ?? 0
        : firstLeg.awayGoals ?? 0) + (regular.awayGoals ?? 0);
    winnerClubId =
      postExtraHome > postExtraAway
        ? secondLeg.homeClubId
        : postExtraAway > postExtraHome
        ? secondLeg.awayClubId
        : undefined;
    if (!winnerClubId) {
      regular.penalties = true;
      regular.penaltyHome = rng.int(3, 6);
      regular.penaltyAway = rng.int(3, 6);
      while (regular.penaltyHome === regular.penaltyAway) {
        regular.penaltyHome = rng.int(4, 7);
        regular.penaltyAway = rng.int(4, 7);
      }
      winnerClubId =
        (regular.penaltyHome ?? 0) > (regular.penaltyAway ?? 0)
          ? secondLeg.homeClubId
          : secondLeg.awayClubId;
    }
  }
  regular.winnerClubId = winnerClubId;
  tie.legs = [firstLeg, regular as KnockoutTie["legs"][1]];
  tie.winnerClubId = winnerClubId;
}

function updateSeasonHeadlines(season: Season, headlines: string[]) {
  season.headlines = [...headlines, ...season.headlines].slice(0, 16);
  season.review.headlines = season.headlines.slice(0, 10);
}

function simulateLeagueMatchday(
  db: UniverseDB,
  season: Season,
  matchday: number,
  rng: RNG
) {
  const clubs = clubMap(db);
  const fixtures = season.leagueFixtures.map((fixture) =>
    fixture.matchday !== matchday
      ? fixture
      : (ensurePossession(
          simulateMatch(
            db,
            season,
            "league",
            fixture.homeClubId,
            fixture.awayClubId,
            rng,
            { id: fixture.id, matchday }
          )
        ) as LeagueFixture)
  );
  season.leagueFixtures = fixtures;
  season.standings = getStandingRows(db, season.id, season.qualifiedClubIds);
  updateSeasonHeadlines(
    season,
    fixtures
      .filter((fixture) => fixture.matchday === matchday)
      .slice(0, 3)
      .map((fixture) =>
        headlineForFixture(
          clubs.get(fixture.homeClubId)!,
          clubs.get(fixture.awayClubId)!,
          fixture
        )
      )
  );
}

function createPlayoffDraw(db: UniverseDB, season: Season, rng: RNG) {
  const upper = season.standings.slice(8, 16).map((row) => row.clubId);
  const lower = rng.shuffle(
    season.standings.slice(16, 24).map((row) => row.clubId)
  );
  season.playoffTies = createTwoLeggedTies(
    db,
    season.id,
    "playoff",
    upper.map((clubId, index) => [clubId, lower[index]]),
    new Set(upper)
  );
}

function createRo16Draw(db: UniverseDB, season: Season, rng: RNG) {
  const seeded = season.standings.slice(0, 8).map((row) => row.clubId);
  const challengers = rng.shuffle(
    season.playoffTies.map((tie) => tie.winnerClubId!).filter(Boolean)
  );
  season.ro16Ties = createTwoLeggedTies(
    db,
    season.id,
    "ro16",
    seeded.map((clubId, index) => [clubId, challengers[index]]),
    new Set(seeded)
  );
}

function createNextBracketRound(
  db: UniverseDB,
  seasonId: string,
  stage: "quarterfinal" | "semifinal",
  entrants: string[],
  rng: RNG
) {
  const shuffled = stage === "quarterfinal" ? rng.shuffle(entrants) : entrants;
  const pairs: [string, string][] = [];
  for (let index = 0; index < shuffled.length; index += 2)
    pairs.push([shuffled[index], shuffled[index + 1]]);
  return createTwoLeggedTies(
    db,
    seasonId,
    stage,
    pairs,
    new Set(pairs.map((pair) => pair[0]))
  );
}

function awardSeason(db: UniverseDB, season: Season) {
  const seasonPlayerStats = db.playerStats.filter(
    (entry) => entry.seasonId === season.id
  );
  const players = playerMap(db);
  const orderedByGoals = seasonPlayerStats.toSorted(
    (a, b) =>
      b.goals - a.goals ||
      b.assists - a.assists ||
      b.manOfTheMatch - a.manOfTheMatch
  );
  const orderedByImpact = seasonPlayerStats.toSorted(
    (a, b) =>
      b.goals * 4 +
      b.assists * 3 +
      b.manOfTheMatch * 2 +
      b.cleanSheets -
      (a.goals * 4 + a.assists * 3 + a.manOfTheMatch * 2 + a.cleanSheets)
  );
  const keepers = seasonPlayerStats
    .filter((entry) => players.get(entry.playerId)?.position === "GK")
    .toSorted(
      (a, b) => b.cleanSheets - a.cleanSheets || b.appearances - a.appearances
    );
  const awards: Awards = {
    topScorerPlayerId: orderedByGoals[0]?.playerId,
    playerOfTournamentId: orderedByImpact[0]?.playerId,
    bestGoalkeeperPlayerId: keepers[0]?.playerId,
    teamOfTournamentPlayerIds: [],
    biggestUpset: season.review.biggestUpset,
    bestMatchId: season.review.bestMatchId,
    breakthroughClubId: season.review.breakthroughClubId,
    clubOfTheSeasonClubId: season.review.clubOfSeasonClubId,
  };
  const positions: Player["position"][] = [
    "GK",
    "DEF",
    "DEF",
    "DEF",
    "MID",
    "MID",
    "MID",
    "MID",
    "FWD",
    "FWD",
    "FWD",
  ];
  for (const position of positions) {
    const candidate = orderedByImpact.find(
      (entry) =>
        players.get(entry.playerId)?.position === position &&
        !awards.teamOfTournamentPlayerIds.includes(entry.playerId)
    );
    if (candidate) awards.teamOfTournamentPlayerIds.push(candidate.playerId);
  }
  season.awards = awards;
}
function finalizeSeason(db: UniverseDB, season: Season, rng: RNG) {
  const clubs = clubMap(db);
  if (season.championClubId) clubs.get(season.championClubId)!.titles += 1;
  if (season.runnerUpClubId) clubs.get(season.runnerUpClubId)!.finals += 1;
  if (season.championClubId) clubs.get(season.championClubId)!.finals += 1;
  for (const clubId of season.qualifiedClubIds) {
    const club = clubs.get(clubId);
    if (!club) continue;
    club.appearances += 1;
    club.lastQualifiedSeasonId = season.id;
    const seasonStat = db.clubStats.find(
      (entry) => entry.seasonId === season.id && entry.clubId === clubId
    );
    club.coefficient = Math.max(
      40,
      club.coefficient * 0.9 +
        (seasonStat?.points ?? 0) * 2.4 +
        (clubId === season.championClubId ? 18 : 0)
    );
  }
  awardSeason(db, season);
  season.status = "completed";
  db.history = db.history.filter((entry) => entry.seasonId !== season.id);
  db.history.unshift({
    seasonId: season.id,
    label: seasonLabel(season),
    championClubId: season.championClubId,
    runnerUpClubId: season.runnerUpClubId,
    topScorerPlayerId: season.awards.topScorerPlayerId,
    playerOfTournamentId: season.awards.playerOfTournamentId,
  });
  evolveUniverse(db, season, rng);
  updateRecords(db);
}

function summarizeSeasonReview(db: UniverseDB, season: Season) {
  const clubs = clubMap(db);
  const topEightCut = season.standings[7];
  const playoffLine = season.standings[23];
  season.review.breakthroughClubId = season.newClubIds.find((clubId) =>
    season.standings.slice(0, 24).some((row) => row.clubId === clubId)
  );
  season.review.clubOfSeasonClubId =
    season.championClubId ?? season.standings[0]?.clubId;
  season.review.biggestUpset = season.headlines.find(
    (headline) =>
      headline.includes("stun") || headline.includes("flip the script")
  );
  season.review.bestMatchId = db.matches
    .filter((match) => match.seasonId === season.id)
    .toSorted(
      (a, b) =>
        (b.homeGoals ?? 0) +
        (b.awayGoals ?? 0) -
        ((a.homeGoals ?? 0) + (a.awayGoals ?? 0))
    )[0]?.id;
  updateSeasonHeadlines(season, [
    topEightCut
      ? `${
          clubs.get(topEightCut.clubId)?.name
        } hold the final direct Round of 16 spot`
      : "The race for the top eight goes to the wire",
    playoffLine
      ? `${
          clubs.get(playoffLine.clubId)?.name
        } sneak into the knockout playoffs`
      : "Playoff drama shapes the knockout picture",
    season.championClubId
      ? `${
          clubs.get(season.championClubId)?.name
        } reign over Europe in ${seasonLabel(season)}`
      : "A new champion crowns the campaign",
  ]);
}

export function generateSeason(db: UniverseDB) {
  const rng = new RNG(db.meta.randomSeed);
  const previous = getCurrentSeason(db);
  const clubs = db.clubs.filter((club) => club.rating >= 68);
  const previousQualified = previous?.qualifiedClubIds ?? [];
  const returningTarget = previousQualified.length ? rng.int(22, 25) : 0;
  const returning: string[] = [];

  if (previousQualified.length) {
    const candidates = rng.shuffle(
      previousQualified
        .map((id) => clubs.find((club) => club.id === id))
        .filter((club): club is Club => Boolean(club))
    );
    while (returning.length < Math.min(returningTarget, candidates.length)) {
      const club = rng.weightedPick(
        candidates.filter((candidate) => !returning.includes(candidate.id)),
        (candidate) => candidate.coefficient * tierWeight(candidate)
      );
      returning.push(club.id);
    }
  }

  const pool = clubs.filter((club) => !returning.includes(club.id));
  const qualified = [...returning];
  while (qualified.length < 36) {
    const pick = rng.weightedPick(
      pool.filter((club) => !qualified.includes(club.id)),
      (club) =>
        club.coefficient *
        tierWeight(club) *
        (["England", "Spain", "Germany", "Italy"].includes(club.country)
          ? 1.05
          : 1)
    );
    qualified.push(pick.id);
  }

  if (previous?.championClubId && !qualified.includes(previous.championClubId))
    qualified[qualified.length - 1] = previous.championClubId;

  const ordered = qualified
    .map((id) => clubs.find((club) => club.id === id)!)
    .toSorted((a, b) => b.coefficient - a.coefficient || b.rating - a.rating)
    .map((club) => club.id);

  const season: Season = {
    id: nextId(db, "season"),
    yearStart: db.meta.nextYearStart,
    yearEnd: db.meta.nextYearStart + 1,
    status: "active",
    currentStep: "seasonGenerated",
    completedSteps: [],
    qualifiedClubIds: ordered,
    newClubIds: ordered.filter((clubId) => !previousQualified.includes(clubId)),
    defendingChampionClubId: previous?.championClubId,
    pots: [
      ordered.slice(0, 9),
      ordered.slice(9, 18),
      ordered.slice(18, 27),
      ordered.slice(27, 36),
    ],
    leagueFixtures: [],
    standings: [],
    playoffTies: [],
    ro16Ties: [],
    quarterfinalTies: [],
    semifinalTies: [],
    awards: { teamOfTournamentPlayerIds: [] },
    review: { headlines: [] },
    headlines: [],
    createdAt: new Date().toISOString(),
  };

  createClubStats(db, season.id, season.qualifiedClubIds);
  createPlayerStats(db, season.id, season.qualifiedClubIds);
  season.standings = getStandingRows(db, season.id, season.qualifiedClubIds);
  updateSeasonHeadlines(season, [
    `${seasonLabel(season)} begins with ${
      season.newClubIds.length
    } clubs marked new this season`,
    previous?.championClubId
      ? `${
          clubs.find((club) => club.id === previous.championClubId)?.name
        } return as defending champions`
      : "A fresh cycle begins across Europe",
  ]);

  db.seasons.push(season);
  db.meta.currentSeasonId = season.id;
  db.meta.nextYearStart += 1;
  db.meta.randomSeed = rng.finalize();
  return season;
}

export function ensureSeason(db: UniverseDB) {
  return getCurrentSeason(db) ?? generateSeason(db);
}

export function advanceTournamentStep(db: UniverseDB) {
  const season = ensureSeason(db);
  const rng = new RNG(db.meta.randomSeed);
  const clubs = clubMap(db);
  const markComplete = (nextStep: TournamentStep) => {
    season.completedSteps = [
      ...new Set([...season.completedSteps, season.currentStep]),
    ];
    season.currentStep = nextStep;
  };

  switch (season.currentStep) {
    case "seasonGenerated":
      season.leagueFixtures = generateLeagueFixtures(db, season, rng);
      updateSeasonHeadlines(season, [
        "League draw complete. Eight opponents are locked in for every club.",
      ]);
      markComplete("leagueDraw");
      break;
    case "leagueDraw":
    case "leagueMatchday1":
    case "leagueMatchday2":
    case "leagueMatchday3":
    case "leagueMatchday4":
    case "leagueMatchday5":
    case "leagueMatchday6":
    case "leagueMatchday7": {
      const matchday =
        season.currentStep === "leagueDraw"
          ? 1
          : Number(season.currentStep.replace("leagueMatchday", "")) + 1;
      simulateLeagueMatchday(db, season, matchday, rng);
      markComplete(`leagueMatchday${matchday}` as TournamentStep);
      break;
    }
    case "leagueMatchday8":
      season.standings = getStandingRows(
        db,
        season.id,
        season.qualifiedClubIds
      );
      updateSeasonHeadlines(season, [
        `${
          clubs.get(season.standings[0].clubId)?.name
        } finish first in the league phase`,
        `${
          clubs.get(season.standings[7].clubId)?.name
        } grab the final direct Round of 16 berth`,
      ]);
      markComplete("finalLeagueTable");
      break;
    case "finalLeagueTable":
      createPlayoffDraw(db, season, rng);
      updateSeasonHeadlines(season, [
        "Playoff draw made. Seeds from ninth to sixteenth host the second legs.",
      ]);
      markComplete("playoffDraw");
      break;
    case "playoffDraw":
      season.playoffTies = season.playoffTies.map((tie) => ({
        ...tie,
        legs: [
          ensurePossession(
            simulateMatch(
              db,
              season,
              "playoff",
              tie.legs[0].homeClubId,
              tie.legs[0].awayClubId,
              rng,
              { id: tie.legs[0].id, leg: 1 }
            )
          ) as KnockoutLeg,
          tie.legs[1],
        ],
      }));
      updateSeasonHeadlines(season, [
        "The playoff first legs tilt the knockout map.",
      ]);
      markComplete("playoffFirstLegs");
      break;
    case "playoffFirstLegs":
      season.playoffTies.forEach((tie) =>
        resolveSecondLeg(db, season, tie, rng)
      );
      updateSeasonHeadlines(
        season,
        season.playoffTies
          .slice(0, 2)
          .map(
            (tie) =>
              `${
                clubs.get(tie.winnerClubId ?? tie.clubAId)?.name
              } survive the playoff gauntlet`
          )
      );
      markComplete("playoffSecondLegs");
      break;
    case "playoffSecondLegs":
      createRo16Draw(db, season, rng);
      updateSeasonHeadlines(season, [
        "Round of 16 draw complete. The top eight meet the playoff survivors.",
      ]);
      markComplete("ro16Draw");
      break;
    case "ro16Draw":
      season.ro16Ties = season.ro16Ties.map((tie) => ({
        ...tie,
        legs: [
          ensurePossession(
            simulateMatch(
              db,
              season,
              "ro16",
              tie.legs[0].homeClubId,
              tie.legs[0].awayClubId,
              rng,
              { id: tie.legs[0].id, leg: 1 }
            )
          ) as KnockoutLeg,
          tie.legs[1],
        ],
      }));
      updateSeasonHeadlines(season, [
        "Round of 16 first legs set up a tense return act.",
      ]);
      markComplete("ro16FirstLegs");
      break;
    case "ro16FirstLegs":
      season.ro16Ties.forEach((tie) => resolveSecondLeg(db, season, tie, rng));
      season.quarterfinalTies = createNextBracketRound(
        db,
        season.id,
        "quarterfinal",
        season.ro16Ties.map((tie) => tie.winnerClubId!).filter(Boolean),
        rng
      );
      updateSeasonHeadlines(season, [
        "Quarterfinalists are confirmed after a brutal last-16 week.",
      ]);
      markComplete("ro16SecondLegs");
      break;
    case "ro16SecondLegs":
      season.quarterfinalTies = season.quarterfinalTies.map((tie) => ({
        ...tie,
        legs: [
          ensurePossession(
            simulateMatch(
              db,
              season,
              "quarterfinal",
              tie.legs[0].homeClubId,
              tie.legs[0].awayClubId,
              rng,
              { id: tie.legs[0].id, leg: 1 }
            )
          ) as KnockoutLeg,
          tie.legs[1],
        ],
      }));
      markComplete("quarterfinalFirstLegs");
      break;
    case "quarterfinalFirstLegs":
      season.quarterfinalTies.forEach((tie) =>
        resolveSecondLeg(db, season, tie, rng)
      );
      season.semifinalTies = createNextBracketRound(
        db,
        season.id,
        "semifinal",
        season.quarterfinalTies.map((tie) => tie.winnerClubId!).filter(Boolean),
        rng
      );
      updateSeasonHeadlines(season, [
        "Semifinal line-up locked after elite-level quarterfinal drama.",
      ]);
      markComplete("quarterfinalSecondLegs");
      break;
    case "quarterfinalSecondLegs":
      season.semifinalTies = season.semifinalTies.map((tie) => ({
        ...tie,
        legs: [
          ensurePossession(
            simulateMatch(
              db,
              season,
              "semifinal",
              tie.legs[0].homeClubId,
              tie.legs[0].awayClubId,
              rng,
              { id: tie.legs[0].id, leg: 1 }
            )
          ) as KnockoutLeg,
          tie.legs[1],
        ],
      }));
      markComplete("semifinalFirstLegs");
      break;
    case "semifinalFirstLegs":
      season.semifinalTies.forEach((tie) =>
        resolveSecondLeg(db, season, tie, rng)
      );
      updateSeasonHeadlines(season, [
        "Second-leg drama decides the finalists.",
      ]);
      markComplete("semifinalSecondLegs");
      break;
    case "semifinalSecondLegs": {
      const finalists = season.semifinalTies
        .map((tie) => tie.winnerClubId!)
        .filter(Boolean);
      season.finalMatch = ensurePossession(
        simulateMatch(db, season, "final", finalists[0], finalists[1], rng, {
          id: nextId(db, "match-final"),
          homeAdvantage: 0,
        })
      );
      if (season.finalMatch.homeGoals === season.finalMatch.awayGoals) {
        season.finalMatch.extraTime = true;
        season.finalMatch.homeGoals =
          (season.finalMatch.homeGoals ?? 0) + poisson(rng, 0.25);
        season.finalMatch.awayGoals =
          (season.finalMatch.awayGoals ?? 0) + poisson(rng, 0.24);
      }
      if (season.finalMatch.homeGoals === season.finalMatch.awayGoals) {
        season.finalMatch.penalties = true;
        season.finalMatch.penaltyHome = rng.int(3, 6);
        season.finalMatch.penaltyAway = rng.int(3, 6);
        while (
          season.finalMatch.penaltyHome === season.finalMatch.penaltyAway
        ) {
          season.finalMatch.penaltyHome = rng.int(4, 7);
          season.finalMatch.penaltyAway = rng.int(4, 7);
        }
        season.finalMatch.winnerClubId =
          (season.finalMatch.penaltyHome ?? 0) >
          (season.finalMatch.penaltyAway ?? 0)
            ? finalists[0]
            : finalists[1];
      } else {
        season.finalMatch.winnerClubId =
          (season.finalMatch.homeGoals ?? 0) >
          (season.finalMatch.awayGoals ?? 0)
            ? finalists[0]
            : finalists[1];
      }
      season.championClubId = season.finalMatch.winnerClubId;
      season.runnerUpClubId =
        season.finalMatch.winnerClubId === finalists[0]
          ? finalists[1]
          : finalists[0];
      updateSeasonHeadlines(season, [
        `${
          clubs.get(season.championClubId ?? "")?.name
        } reach the summit after a grand final night`,
      ]);
      markComplete("final");
      break;
    }
    case "final":
      updateSeasonHeadlines(season, [
        `${
          clubs.get(season.championClubId ?? "")?.name
        } are crowned champions of Europe`,
      ]);
      markComplete("champion");
      break;
    case "champion":
      summarizeSeasonReview(db, season);
      finalizeSeason(db, season, rng);
      markComplete("seasonHighlights");
      break;
    case "seasonHighlights":
      break;
  }

  season.standings = getStandingRows(db, season.id, season.qualifiedClubIds);
  syncSeasonMatches(db, season);
  db.meta.randomSeed = rng.finalize();
  return { season, nextLabel: STEP_LABELS[season.currentStep] };
}
