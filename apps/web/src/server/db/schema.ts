import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestampFields = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
};

export const nations = sqliteTable("nations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isoCode: text("iso_code").notNull(),
});

export const leagues = sqliteTable("leagues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nationId: integer("nation_id").notNull(),
  tier: integer("tier").notNull(),
  isPlayable: integer("is_playable", { mode: "boolean" }).notNull(),
  prestige: integer("prestige").notNull(),
  defaultCompetitionColor: text("default_competition_color").notNull(),
});

export const clubs = sqliteTable("clubs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  nationId: integer("nation_id").notNull(),
  leagueId: integer("league_id").notNull(),
  rivalClubId: integer("rival_club_id"),
  prestige: integer("prestige").notNull(),
  attackRating: integer("attack_rating").notNull(),
  midfieldRating: integer("midfield_rating").notNull(),
  defenseRating: integer("defense_rating").notNull(),
  transferBudgetDefault: integer("transfer_budget_default").notNull(),
  wageBudgetDefault: integer("wage_budget_default").notNull(),
  stadiumName: text("stadium_name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
});

export const positions = sqliteTable("positions", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const playerArchetypes = sqliteTable("player_archetypes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  positionGroup: text("position_group").notNull(),
  description: text("description").notNull(),
});

export const competitionTemplates = sqliteTable("competition_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  nationId: integer("nation_id"),
  leagueId: integer("league_id"),
  fixtureRulesJson: text("fixture_rules_json").notNull(),
  prizeRulesJson: text("prize_rules_json").notNull(),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  commonName: text("common_name"),
  nationalityId: integer("nationality_id").notNull(),
  birthDate: integer("birth_date", { mode: "timestamp" }).notNull(),
  preferredFoot: text("preferred_foot").notNull(),
  heightCm: integer("height_cm").notNull(),
  weightKg: integer("weight_kg").notNull(),
  potential: integer("potential").notNull(),
  overall: integer("overall").notNull(),
  primaryPosition: text("primary_position").notNull(),
  secondaryPositionsJson: text("secondary_positions_json").notNull(),
  valueAmount: integer("value_amount").notNull(),
  wageAmount: integer("wage_amount").notNull(),
  faceAssetKey: text("face_asset_key"),
  bodyType: text("body_type").notNull(),
  isRealPlayer: integer("is_real_player", { mode: "boolean" }).notNull(),
  createdFrom: text("created_from").notNull(),
  seedClubId: integer("seed_club_id"),
});

export const careers = sqliteTable("careers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  managerProfileName: text("manager_profile_name").notNull(),
  controlledClubId: integer("controlled_club_id").notNull(),
  currentDate: integer("current_date", { mode: "timestamp" }).notNull(),
  currentSeasonNumber: integer("current_season_number").notNull(),
  status: text("status").notNull(),
  rngSeed: text("rng_seed").notNull(),
  ...timestampFields,
});

export const careerSettings = sqliteTable("career_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  currencySymbol: text("currency_symbol").notNull(),
  boardStrictness: integer("board_strictness").notNull(),
  transferDifficulty: integer("transfer_difficulty").notNull(),
  scoutingDifficulty: integer("scouting_difficulty").notNull(),
  enableFirstWindow: integer("enable_first_window", {
    mode: "boolean",
  }).notNull(),
  enableInternationalManagement: integer("enable_international_management", {
    mode: "boolean",
  }).notNull(),
  injuryFrequency: integer("injury_frequency").notNull(),
  playerGrowthSpeed: integer("player_growth_speed").notNull(),
  autosaveEnabled: integer("autosave_enabled", { mode: "boolean" }).notNull(),
});

export const careerClubState = sqliteTable("career_club_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  clubId: integer("club_id").notNull(),
  transferBudget: integer("transfer_budget").notNull(),
  wageBudget: integer("wage_budget").notNull(),
  weeklyWageSpend: integer("weekly_wage_spend").notNull(),
  youthScoutSlots: integer("youth_scout_slots").notNull(),
  transferScoutSlots: integer("transfer_scout_slots").notNull(),
  managerRating: integer("manager_rating").notNull(),
  moraleTeamAvg: integer("morale_team_avg").notNull(),
  currentLeaguePosition: integer("current_league_position"),
});

export const careerRosters = sqliteTable("career_rosters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  playerId: integer("player_id").notNull(),
  clubId: integer("club_id"),
  squadRole: text("squad_role").notNull(),
  squadStatus: text("squad_status").notNull(),
  shirtNumber: integer("shirt_number"),
  joinedOn: integer("joined_on", { mode: "timestamp" }).notNull(),
  contractEndDate: integer("contract_end_date", { mode: "timestamp" }),
  releaseClause: integer("release_clause"),
  isListedForLoan: integer("is_listed_for_loan", { mode: "boolean" }).notNull(),
  isListedForTransfer: integer("is_listed_for_transfer", {
    mode: "boolean",
  }).notNull(),
  morale: integer("morale").notNull(),
  form: integer("form").notNull(),
  sharpnessPlaceholder: integer("sharpness_placeholder"),
  fitness: integer("fitness").notNull(),
  staminaModifier: integer("stamina_modifier").notNull(),
  injuryStatus: text("injury_status").notNull(),
  injuryType: text("injury_type"),
  injuryEndDate: integer("injury_end_date", { mode: "timestamp" }),
});

export const transferWindows = sqliteTable("transfer_windows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  leagueId: integer("league_id"),
  name: text("name").notNull(),
  opensOn: integer("opens_on", { mode: "timestamp" }).notNull(),
  closesOn: integer("closes_on", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull(),
});

export const transferTargets = sqliteTable("transfer_targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  clubId: integer("club_id").notNull(),
  playerId: integer("player_id").notNull(),
  priority: integer("priority").notNull(),
  scoutStatus: text("scout_status").notNull(),
  scoutDueDate: integer("scout_due_date", { mode: "timestamp" }),
  scoutedOverallMin: integer("scouted_overall_min"),
  scoutedOverallMax: integer("scouted_overall_max"),
  scoutedPotentialMin: integer("scouted_potential_min"),
  scoutedPotentialMax: integer("scouted_potential_max"),
  notes: text("notes"),
});

export const transferOffers = sqliteTable("transfer_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  fromClubId: integer("from_club_id").notNull(),
  toClubId: integer("to_club_id").notNull(),
  playerId: integer("player_id").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  feeAmount: integer("fee_amount"),
  loanLengthMonths: integer("loan_length_months"),
  wageSplitPercent: integer("wage_split_percent"),
  sellOnPercent: integer("sell_on_percent"),
  exchangePlayerId: integer("exchange_player_id"),
  submittedOn: integer("submitted_on", { mode: "timestamp" }).notNull(),
  respondedOn: integer("responded_on", { mode: "timestamp" }),
  expiresOn: integer("expires_on", { mode: "timestamp" }),
});

export const contractNegotiations = sqliteTable("contract_negotiations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  playerId: integer("player_id").notNull(),
  clubId: integer("club_id").notNull(),
  status: text("status").notNull(),
  squadRole: text("squad_role").notNull(),
  contractYears: integer("contract_years").notNull(),
  weeklyWage: integer("weekly_wage").notNull(),
  signingBonus: integer("signing_bonus").notNull(),
  cleanSheetBonus: integer("clean_sheet_bonus"),
  goalBonus: integer("goal_bonus"),
  releaseClause: integer("release_clause"),
  negotiatedOn: integer("negotiated_on", { mode: "timestamp" }).notNull(),
  completedOn: integer("completed_on", { mode: "timestamp" }),
});

export const transferHistory = sqliteTable("transfer_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  playerId: integer("player_id").notNull(),
  fromClubId: integer("from_club_id"),
  toClubId: integer("to_club_id"),
  transferType: text("transfer_type").notNull(),
  feeAmount: integer("fee_amount"),
  completedOn: integer("completed_on", { mode: "timestamp" }).notNull(),
});

export const inboxMessages = sqliteTable("inbox_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  sentOn: integer("sent_on", { mode: "timestamp" }).notNull(),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull(),
  actionPayloadJson: text("action_payload_json"),
});

export const careerCompetitions = sqliteTable("career_competitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  templateId: integer("template_id").notNull(),
  seasonNumber: integer("season_number").notNull(),
  name: text("name").notNull(),
  stage: text("stage").notNull(),
  status: text("status").notNull(),
});

export const fixtures = sqliteTable("fixtures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careerId: integer("career_id").notNull(),
  competitionId: integer("competition_id").notNull(),
  seasonNumber: integer("season_number").notNull(),
  matchdayNumber: integer("matchday_number"),
  roundName: text("round_name"),
  homeClubId: integer("home_club_id").notNull(),
  awayClubId: integer("away_club_id").notNull(),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }).notNull(),
  kickoffLabel: text("kickoff_label"),
  resultStatus: text("result_status").notNull(),
  homeGoals: integer("home_goals"),
  awayGoals: integer("away_goals"),
  extraTimeUsed: integer("extra_time_used", { mode: "boolean" }).notNull(),
  penaltiesUsed: integer("penalties_used", { mode: "boolean" }).notNull(),
  winnerClubId: integer("winner_club_id"),
});

export const leagueTables = sqliteTable("league_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitionId: integer("competition_id").notNull(),
  clubId: integer("club_id").notNull(),
  played: integer("played").notNull(),
  wins: integer("wins").notNull(),
  draws: integer("draws").notNull(),
  losses: integer("losses").notNull(),
  goalsFor: integer("goals_for").notNull(),
  goalsAgainst: integer("goals_against").notNull(),
  goalDifference: integer("goal_difference").notNull(),
  points: integer("points").notNull(),
  rank: integer("rank").notNull(),
});
