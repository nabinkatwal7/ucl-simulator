import { eq } from "drizzle-orm";
import { db } from "../db";
import { clubs, leagues } from "../db/schema";

export async function listClubs() {
  return db
    .select({
      id: clubs.id,
      name: clubs.name,
      shortName: clubs.shortName,
      leagueName: leagues.name,
    })
    .from(clubs)
    .leftJoin(leagues, eq(clubs.leagueId, leagues.id));
}
