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
  enableFirstWindow: integer("enable_first_window", { mode: "boolean" }).notNull(),
  enableInternationalManagement: integer("enable_international_management", { mode: "boolean" }).notNull(),
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