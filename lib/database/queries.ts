import { readUniverse } from "@/lib/database/store";
import type {
  Club,
  DashboardSnapshot,
  MatchResult,
  Player,
  Season,
} from "@/lib/models/types";
import { unstable_noStore as noStore } from "next/cache";

export async function getUniverseSnapshot(): Promise<DashboardSnapshot> {
  noStore();
  const db = await readUniverse();
  const currentSeason = db.seasons.find(
    (season) => season.id === db.meta.currentSeasonId
  );
  return {
    currentSeason,
    clubs: db.clubs,
    players: db.players,
    history: db.history,
    records: db.records,
  };
}

export async function getCurrentSeason(): Promise<Season | undefined> {
  noStore();
  const db = await readUniverse();
  return db.seasons.find((season) => season.id === db.meta.currentSeasonId);
}

export async function getClubs(): Promise<Club[]> {
  noStore();
  const db = await readUniverse();
  return db.clubs.toSorted((a, b) => b.coefficient - a.coefficient);
}

export async function getPlayers(): Promise<Player[]> {
  noStore();
  const db = await readUniverse();
  return db.players
    .filter((player) => !player.retired)
    .toSorted((a, b) => b.rating - a.rating);
}

export async function getClubById(
  id: string
): Promise<{ club?: Club; players: Player[]; matches: MatchResult[] }> {
  noStore();
  const db = await readUniverse();
  return {
    club: db.clubs.find((club) => club.id === id),
    players: db.players.filter(
      (player) => player.clubId === id && !player.retired
    ),
    matches: db.matches
      .filter((match) => match.homeClubId === id || match.awayClubId === id)
      .slice(-20)
      .reverse(),
  };
}

export async function getPlayerById(
  id: string
): Promise<{ player?: Player; matches: MatchResult[] }> {
  noStore();
  const db = await readUniverse();
  const player = db.players.find((entry) => entry.id === id);
  return {
    player,
    matches: db.matches
      .filter((match) => match.events.some((event) => event.playerId === id))
      .slice(-20)
      .reverse(),
  };
}
