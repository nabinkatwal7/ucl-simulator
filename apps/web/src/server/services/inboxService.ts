import { desc, inArray } from "drizzle-orm";
import { db } from "../db";
import { inboxMessages } from "../db/schema";

export async function listInboxMessagesByCareerIds(
  careerIds: number[],
  limitPerCareer = 5
) {
  if (careerIds.length === 0) {
    return new Map<number, (typeof inboxMessages.$inferSelect)[]>();
  }

  const rows = await db
    .select()
    .from(inboxMessages)
    .where(inArray(inboxMessages.careerId, careerIds))
    .orderBy(desc(inboxMessages.sentOn));

  const grouped = new Map<number, (typeof inboxMessages.$inferSelect)[]>();

  for (const row of rows) {
    const existing = grouped.get(row.careerId) ?? [];
    if (existing.length >= limitPerCareer) {
      continue;
    }
    existing.push(row);
    grouped.set(row.careerId, existing);
  }

  return grouped;
}

export async function createWelcomeMessage(careerId: number, date: Date) {
  await db.insert(inboxMessages).values({
    careerId,
    sentOn: date,
    category: "board",
    subject: "Welcome to the club",
    body: "Board expectations set. Your first objectives will arrive shortly.",
    isRead: 0,
    actionPayloadJson: null,
  });
}
