export type TournamentStep =
  | 'seasonGenerated'
  | 'leagueDraw'
  | 'leagueMatchday1'
  | 'leagueMatchday2'
  | 'leagueMatchday3'
  | 'leagueMatchday4'
  | 'leagueMatchday5'
  | 'leagueMatchday6'
  | 'leagueMatchday7'
  | 'leagueMatchday8'
  | 'finalLeagueTable'
  | 'playoffDraw'
  | 'playoffFirstLegs'
  | 'playoffSecondLegs'
  | 'ro16Draw'
  | 'ro16FirstLegs'
  | 'ro16SecondLegs'
  | 'quarterfinalFirstLegs'
  | 'quarterfinalSecondLegs'
  | 'semifinalFirstLegs'
  | 'semifinalSecondLegs'
  | 'final'
  | 'champion'
  | 'seasonHighlights';

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type ClubTier = 'elite' | 'strong' | 'contender' | 'outsider';
export type MatchStage = 'league' | 'playoff' | 'ro16' | 'quarterfinal' | 'semifinal' | 'final';

export interface Club {
  id: string;
  name: string;
  country: string;
  league: string;
  rating: number;
  attackRating: number;
  defenseRating: number;
  midfieldRating: number;
  goalkeeperRating: number;
  coefficient: number;
  appearances: number;
  titles: number;
  finals: number;
  logo: string;
  tier: ClubTier;
  lastQualifiedSeasonId?: string;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: PlayerPosition;
  rating: number;
  clubId: string;
  roleImportance: number;
  retired?: boolean;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red';
  clubId: string;
  playerId: string;
  assistPlayerId?: string;
}

export interface MatchResult {
  id: string;
  seasonId: string;
  stage: MatchStage;
  homeClubId: string;
  awayClubId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  extraTime: boolean;
  penalties: boolean;
  penaltyHome?: number;
  penaltyAway?: number;
  winnerClubId?: string;
  matchday?: number;
  leg?: 1 | 2;
  events: MatchEvent[];
  manOfTheMatchPlayerId?: string;
  shots?: { home: number; away: number };
  xg?: { home: number; away: number };
  possession?: { home: number; away: number };
  corners?: { home: number; away: number };
  fouls?: { home: number; away: number };
}

export interface PlayerSeasonStat {
  id: string;
  seasonId: string;
  playerId: string;
  clubId: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  manOfTheMatch: number;
}

export interface ClubSeasonStat {
  id: string;
  seasonId: string;
  clubId: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  cleanSheets: number;
  form: string[];
  homeWins: number;
  homeDraws: number;
  homeLosses: number;
  awayWins: number;
  awayDraws: number;
  awayLosses: number;
  played: number;
}

export interface LeagueFixture extends MatchResult {
  stage: 'league';
  matchday: number;
}

export interface KnockoutLeg extends MatchResult {
  stage: 'playoff' | 'ro16' | 'quarterfinal' | 'semifinal';
  leg: 1 | 2;
}

export interface KnockoutTie {
  id: string;
  stage: 'playoff' | 'ro16' | 'quarterfinal' | 'semifinal';
  clubAId: string;
  clubBId: string;
  legs: [KnockoutLeg, KnockoutLeg];
  winnerClubId?: string;
}

export interface Awards {
  topScorerPlayerId?: string;
  playerOfTournamentId?: string;
  bestGoalkeeperPlayerId?: string;
  teamOfTournamentPlayerIds: string[];
  biggestUpset?: string;
  bestMatchId?: string;
  clubOfTheSeasonClubId?: string;
  breakthroughClubId?: string;
}

export interface SeasonReview {
  headlines: string[];
  biggestUpset?: string;
  bestMatchId?: string;
  breakthroughClubId?: string;
  clubOfSeasonClubId?: string;
}

export interface Season {
  id: string;
  yearStart: number;
  yearEnd: number;
  status: 'active' | 'completed';
  currentStep: TournamentStep;
  completedSteps: TournamentStep[];
  qualifiedClubIds: string[];
  newClubIds: string[];
  defendingChampionClubId?: string;
  pots: string[][];
  leagueFixtures: LeagueFixture[];
  standings: ClubSeasonStat[];
  playoffTies: KnockoutTie[];
  ro16Ties: KnockoutTie[];
  quarterfinalTies: KnockoutTie[];
  semifinalTies: KnockoutTie[];
  finalMatch?: MatchResult;
  championClubId?: string;
  runnerUpClubId?: string;
  awards: Awards;
  review: SeasonReview;
  headlines: string[];
  createdAt: string;
}

export interface HistoryEntry {
  seasonId: string;
  label: string;
  championClubId?: string;
  runnerUpClubId?: string;
  topScorerPlayerId?: string;
  playerOfTournamentId?: string;
}

export interface Records {
  mostTitlesClubIds: string[];
  mostFinalsClubIds: string[];
  mostGoalsPlayerIds: string[];
  mostAssistsPlayerIds: string[];
  mostCleanSheetsPlayerIds: string[];
}

export interface MetaState {
  currentSeasonId?: string;
  nextYearStart: number;
  nextId: number;
  randomSeed: number;
  autoplay: boolean;
}

export interface UniverseDB {
  meta: MetaState;
  clubs: Club[];
  players: Player[];
  seasons: Season[];
  matches: MatchResult[];
  playerStats: PlayerSeasonStat[];
  clubStats: ClubSeasonStat[];
  history: HistoryEntry[];
  records: Records;
}

export interface DashboardSnapshot {
  currentSeason?: Season;
  clubs: Club[];
  players: Player[];
  history: HistoryEntry[];
  records: Records;
}
