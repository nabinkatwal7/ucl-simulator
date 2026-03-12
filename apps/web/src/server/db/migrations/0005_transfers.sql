PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS transfer_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  league_id INTEGER,
  name TEXT NOT NULL,
  opens_on INTEGER NOT NULL,
  closes_on INTEGER NOT NULL,
  is_active INTEGER NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS transfer_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  scout_status TEXT NOT NULL,
  scout_due_date INTEGER,
  scouted_overall_min INTEGER,
  scouted_overall_max INTEGER,
  scouted_potential_min INTEGER,
  scouted_potential_max INTEGER,
  notes TEXT,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS transfer_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  from_club_id INTEGER NOT NULL,
  to_club_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  fee_amount INTEGER,
  loan_length_months INTEGER,
  wage_split_percent INTEGER,
  sell_on_percent INTEGER,
  exchange_player_id INTEGER,
  submitted_on INTEGER NOT NULL,
  responded_on INTEGER,
  expires_on INTEGER,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (from_club_id) REFERENCES clubs(id),
  FOREIGN KEY (to_club_id) REFERENCES clubs(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS contract_negotiations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  squad_role TEXT NOT NULL,
  contract_years INTEGER NOT NULL,
  weekly_wage INTEGER NOT NULL,
  signing_bonus INTEGER NOT NULL,
  clean_sheet_bonus INTEGER,
  goal_bonus INTEGER,
  release_clause INTEGER,
  negotiated_on INTEGER NOT NULL,
  completed_on INTEGER,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS transfer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  from_club_id INTEGER,
  to_club_id INTEGER,
  transfer_type TEXT NOT NULL,
  fee_amount INTEGER,
  completed_on INTEGER NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (from_club_id) REFERENCES clubs(id),
  FOREIGN KEY (to_club_id) REFERENCES clubs(id)
);

CREATE INDEX IF NOT EXISTS idx_transfer_offers_status ON transfer_offers(career_id, status);
CREATE INDEX IF NOT EXISTS idx_transfer_targets_career ON transfer_targets(career_id, club_id);