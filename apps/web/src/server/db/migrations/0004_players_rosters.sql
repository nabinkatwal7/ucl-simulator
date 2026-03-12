PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  common_name TEXT,
  nationality_id INTEGER NOT NULL,
  birth_date INTEGER NOT NULL,
  preferred_foot TEXT NOT NULL,
  height_cm INTEGER NOT NULL,
  weight_kg INTEGER NOT NULL,
  potential INTEGER NOT NULL,
  overall INTEGER NOT NULL,
  primary_position TEXT NOT NULL,
  secondary_positions_json TEXT NOT NULL,
  value_amount INTEGER NOT NULL,
  wage_amount INTEGER NOT NULL,
  face_asset_key TEXT,
  body_type TEXT NOT NULL,
  is_real_player INTEGER NOT NULL,
  created_from TEXT NOT NULL,
  seed_club_id INTEGER,
  FOREIGN KEY (nationality_id) REFERENCES nations(id),
  FOREIGN KEY (seed_club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS career_rosters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  club_id INTEGER,
  squad_role TEXT NOT NULL,
  squad_status TEXT NOT NULL,
  shirt_number INTEGER,
  joined_on INTEGER NOT NULL,
  contract_end_date INTEGER,
  release_clause INTEGER,
  is_listed_for_loan INTEGER NOT NULL,
  is_listed_for_transfer INTEGER NOT NULL,
  morale INTEGER NOT NULL,
  form INTEGER NOT NULL,
  sharpness_placeholder INTEGER,
  fitness INTEGER NOT NULL,
  stamina_modifier INTEGER NOT NULL,
  injury_status TEXT NOT NULL,
  injury_type TEXT,
  injury_end_date INTEGER,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX IF NOT EXISTS idx_career_rosters_career_club ON career_rosters(career_id, club_id);