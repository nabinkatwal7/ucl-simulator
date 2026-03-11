import { CLUB_POOL } from "@/lib/models/club-pool";
import type {
  Club,
  MetaState,
  Player,
  PlayerPosition,
  UniverseDB,
} from "@/lib/models/types";
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database", "ucl-universe.json");

let writeQueue = Promise.resolve();

const firstNames = [
  "Adrian",
  "Leo",
  "Mateo",
  "Theo",
  "Luca",
  "Nico",
  "Martin",
  "Jamal",
  "Victor",
  "Hugo",
  "Andre",
  "Pablo",
  "Ruben",
  "Alex",
  "Milan",
  "Dario",
  "Tomas",
  "Joao",
  "Rafael",
  "Sami",
];
const lastNames = [
  "Silva",
  "Fernandez",
  "Muller",
  "Bennett",
  "Costa",
  "Rossi",
  "Novak",
  "Petrov",
  "Garcia",
  "Martins",
  "Diaz",
  "Keller",
  "Marin",
  "Santos",
  "Brown",
  "Lopez",
  "Torres",
  "Yilmaz",
  "Ilic",
  "Kovac",
];

function nextId(meta: MetaState, prefix: string): string {
  meta.nextId += 1;
  return `${prefix}-${meta.nextId}`;
}

function buildPlayer(
  club: Club,
  meta: MetaState,
  position: PlayerPosition,
  index: number
): Player {
  const positionBase =
    position === "GK"
      ? club.goalkeeperRating
      : position === "DEF"
      ? club.defenseRating
      : position === "MID"
      ? club.midfieldRating
      : club.attackRating;
  const age = position === "GK" ? 24 + (index % 8) : 18 + (index % 13);
  return {
    id: nextId(meta, "player"),
    name: `${firstNames[(meta.nextId + index) % firstNames.length]} ${
      lastNames[(meta.nextId + club.name.length + index) % lastNames.length]
    }`,
    age,
    nationality: club.country,
    position,
    rating: Math.max(58, Math.min(96, positionBase + (index % 5) - 2)),
    clubId: club.id,
    roleImportance: Math.max(1, 5 - (index % 5)),
  };
}

function createInitialUniverse(): UniverseDB {
  const meta: MetaState = {
    nextYearStart: 2025,
    nextId: 0,
    randomSeed: 173_221,
    autoplay: false,
  };

  const clubs: Club[] = CLUB_POOL.map((seed) => ({
    id: nextId(meta, "club"),
    ...seed,
    appearances: 0,
    titles: 0,
    finals: 0,
  }));

  const players: Player[] = [];
  for (const club of clubs) {
    const positions: PlayerPosition[] = [
      "GK",
      "GK",
      "DEF",
      "DEF",
      "DEF",
      "DEF",
      "DEF",
      "DEF",
      "MID",
      "MID",
      "MID",
      "MID",
      "MID",
      "MID",
      "FWD",
      "FWD",
      "FWD",
      "FWD",
      "FWD",
      "DEF",
    ];
    positions.forEach((position, index) => {
      players.push(buildPlayer(club, meta, position, index));
    });
  }

  return {
    meta,
    clubs,
    players,
    seasons: [],
    matches: [],
    playerStats: [],
    clubStats: [],
    history: [],
    records: {
      mostTitlesClubIds: [],
      mostFinalsClubIds: [],
      mostGoalsPlayerIds: [],
      mostAssistsPlayerIds: [],
      mostCleanSheetsPlayerIds: [],
    },
  };
}

async function ensureDatabaseFile() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    const initial = createInitialUniverse();
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

export async function readUniverse(): Promise<UniverseDB> {
  await ensureDatabaseFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as UniverseDB;
}

export async function writeUniverse(data: UniverseDB): Promise<void> {
  await ensureDatabaseFile();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function mutateUniverse<T>(
  mutator: (db: UniverseDB) => T | Promise<T>
): Promise<T> {
  const operation = writeQueue.then(async () => {
    const db = await readUniverse();
    const result = await mutator(db);
    await writeUniverse(db);
    return result;
  });
  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );
  return operation;
}
