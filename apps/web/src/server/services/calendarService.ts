import { eq } from "drizzle-orm";
import { db } from "../db";
import { careers, inboxMessages } from "../db/schema";

export async function advanceDay(careerId: number) {
  const careerRows = await db
    .select({ id: careers.id, currentDate: careers.currentDate })
    .from(careers)
    .where(eq(careers.id, careerId));

  if (careerRows.length === 0) {
    return;
  }

  const currentDate =
    careerRows[0].currentDate instanceof Date
      ? careerRows[0].currentDate
      : new Date(careerRows[0].currentDate);

  const nextDate = new Date(currentDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  await db
    .update(careers)
    .set({ currentDate: nextDate, updatedAt: new Date() })
    .where(eq(careers.id, careerId));

  await db.insert(inboxMessages).values({
    careerId,
    sentOn: nextDate,
    category: "calendar",
    subject: "Daily briefing",
    body: `A new day begins. Date advanced to ${nextDate.toISOString().slice(0, 10)}.`,
    isRead: 0,
    actionPayloadJson: null,
  });
}