import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { careerRosters, contractNegotiations, inboxMessages } from "../db/schema";

export async function renewContract(params: {
  careerId: number;
  playerId: number;
  clubId: number;
  contractYears: number;
  weeklyWage: number;
  signingBonus: number;
  squadRole: string;
}) {
  const now = new Date();
  await db.insert(contractNegotiations).values({
    careerId: params.careerId,
    playerId: params.playerId,
    clubId: params.clubId,
    status: "agreed",
    squadRole: params.squadRole,
    contractYears: params.contractYears,
    weeklyWage: params.weeklyWage,
    signingBonus: params.signingBonus,
    cleanSheetBonus: null,
    goalBonus: null,
    releaseClause: null,
    negotiatedOn: now,
    completedOn: now,
  });

  await db
    .update(careerRosters)
    .set({
      contractEndDate: new Date(now.getUTCFullYear() + params.contractYears, 5, 30),
      squadRole: params.squadRole,
    })
    .where(
      and(
        eq(careerRosters.careerId, params.careerId),
        eq(careerRosters.playerId, params.playerId)
      )
    );

  await db.insert(inboxMessages).values({
    careerId: params.careerId,
    sentOn: now,
    category: "contract",
    subject: "Contract renewed",
    body: `Player ${params.playerId} renewed for ${params.contractYears} years.`,
    isRead: 0,
    actionPayloadJson: null,
  });
}