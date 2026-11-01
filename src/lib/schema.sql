-- SQLite. Ангар, каталог техники, кошелёк.

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  nick TEXT NOT NULL UNIQUE COLLATE NOCASE,
  salt TEXT NOT NULL,
  pass TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player (
  id TEXT PRIMARY KEY,
  silver INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  bonds INTEGER NOT NULL DEFAULT 0,
  free_xp INTEGER NOT NULL DEFAULT 0,
  selected TEXT NOT NULL DEFAULT 't34'
);

CREATE TABLE IF NOT EXISTS garage (
  player_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS gear_slot (
  player_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 2),
  gear_id TEXT NOT NULL,
  PRIMARY KEY (player_id, vehicle_id, slot)
);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  line TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  reload REAL,
  aim REAL,
  dispersion REAL,
  view REAL,
  hp REAL,
  speed REAL,
  camo REAL,
  he REAL
);

CREATE TABLE IF NOT EXISTS depot_gear (
  player_id TEXT NOT NULL,
  gear_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, gear_id)
);

CREATE TABLE IF NOT EXISTS depot_shell (
  player_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, kind)
);

CREATE TABLE IF NOT EXISTS vehicle (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  tier INTEGER NOT NULL,
  type TEXT NOT NULL,
  role TEXT NOT NULL,
  hp INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  hull_front INTEGER NOT NULL,
  hull_side INTEGER NOT NULL,
  hull_rear INTEGER NOT NULL,
  turret_front INTEGER NOT NULL,
  turret_side INTEGER NOT NULL,
  turret_rear INTEGER NOT NULL,
  casemate INTEGER NOT NULL,
  gun TEXT NOT NULL,
  caliber INTEGER NOT NULL,
  reload REAL NOT NULL,
  dispersion REAL NOT NULL,
  aim REAL NOT NULL,
  view INTEGER NOT NULL,
  camo REAL NOT NULL,
  mass INTEGER NOT NULL,
  power INTEGER NOT NULL,
  traverse INTEGER NOT NULL,
  repair INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  cost INTEGER NOT NULL,
  pred TEXT,
  he_taken REAL
);

CREATE TABLE IF NOT EXISTS vehicle_shell (
  vehicle_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  damage INTEGER NOT NULL,
  pen INTEGER NOT NULL,
  PRIMARY KEY (vehicle_id, kind)
);
