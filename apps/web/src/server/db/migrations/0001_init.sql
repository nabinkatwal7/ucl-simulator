PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  iso_code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  nation_id INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  is_playable INTEGER NOT NULL,
  prestige INTEGER NOT NULL,
  default_competition_color TEXT NOT NULL,
  FOREIGN KEY (nation_id) REFERENCES nations(id)
);

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  nation_id INTEGER NOT NULL,
  league_id INTEGER NOT NULL,
  rival_club_id INTEGER,
  prestige INTEGER NOT NULL,
  attack_rating INTEGER NOT NULL,
  midfield_rating INTEGER NOT NULL,
  defense_rating INTEGER NOT NULL,
  transfer_budget_default INTEGER NOT NULL,
  wage_budget_default INTEGER NOT NULL,
  stadium_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  FOREIGN KEY (nation_id) REFERENCES nations(id),
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (rival_club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS positions (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player_archetypes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position_group TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS competition_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  nation_id INTEGER,
  league_id INTEGER,
  fixture_rules_json TEXT NOT NULL,
  prize_rules_json TEXT NOT NULL,
  FOREIGN KEY (nation_id) REFERENCES nations(id),
  FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS careers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  manager_profile_name TEXT NOT NULL,
  controlled_club_id INTEGER NOT NULL,
  current_date INTEGER NOT NULL,
  current_season_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  rng_seed TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (controlled_club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS career_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  currency_symbol TEXT NOT NULL,
  board_strictness INTEGER NOT NULL,
  transfer_difficulty INTEGER NOT NULL,
  scouting_difficulty INTEGER NOT NULL,
  enable_first_window INTEGER NOT NULL,
  enable_international_management INTEGER NOT NULL,
  injury_frequency INTEGER NOT NULL,
  player_growth_speed INTEGER NOT NULL,
  autosave_enabled INTEGER NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id)
);

CREATE TABLE IF NOT EXISTS career_club_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  transfer_budget INTEGER NOT NULL,
  wage_budget INTEGER NOT NULL,
  weekly_wage_spend INTEGER NOT NULL,
  youth_scout_slots INTEGER NOT NULL,
  transfer_scout_slots INTEGER NOT NULL,
  manager_rating INTEGER NOT NULL,
  morale_team_avg INTEGER NOT NULL,
  current_league_position INTEGER,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX IF NOT EXISTS idx_clubs_league ON clubs(league_id);
CREATE INDEX IF NOT EXISTS idx_career_club_state_career ON career_club_state(career_id);
