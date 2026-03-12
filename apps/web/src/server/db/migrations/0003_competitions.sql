PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS career_competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (template_id) REFERENCES competition_templates(id)
);

CREATE TABLE IF NOT EXISTS fixtures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id INTEGER NOT NULL,
  competition_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  matchday_number INTEGER,
  round_name TEXT,
  home_club_id INTEGER NOT NULL,
  away_club_id INTEGER NOT NULL,
  scheduled_date INTEGER NOT NULL,
  kickoff_label TEXT,
  result_status TEXT NOT NULL,
  home_goals INTEGER,
  away_goals INTEGER,
  extra_time_used INTEGER NOT NULL,
  penalties_used INTEGER NOT NULL,
  winner_club_id INTEGER,
  FOREIGN KEY (career_id) REFERENCES careers(id),
  FOREIGN KEY (competition_id) REFERENCES career_competitions(id),
  FOREIGN KEY (home_club_id) REFERENCES clubs(id),
  FOREIGN KEY (away_club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS league_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  played INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  goals_for INTEGER NOT NULL,
  goals_against INTEGER NOT NULL,
  goal_difference INTEGER NOT NULL,
  points INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES career_competitions(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_career_date ON fixtures(career_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_league_tables_comp ON league_tables(competition_id);