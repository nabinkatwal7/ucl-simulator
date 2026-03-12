import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  careerClubState,
  careerRosters,
  careers,
  clubs,
  inboxMessages,
  players,
  transferHistory,
  transferOffers,
  transferTargets,
} from "../db/schema";

export async function listTransferMarket(careerId: number, limit = 20) {
  const rows = await db
    .select({
      playerId: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      overall: players.overall,
      valueAmount: players.valueAmount,
      clubId: careerRosters.clubId,
    })
    .from(careerRosters)
    .leftJoin(players, eq(careerRosters.playerId, players.id))
    .where(eq(careerRosters.careerId, careerId))
    .limit(limit);

  return rows;
}

export async function addTransferTarget(params: {
  careerId: number;
  clubId: number;
  playerId: number;
  priority: number;
}) {
  await db.insert(transferTargets).values({
    careerId: params.careerId,
    clubId: params.clubId,
    playerId: params.playerId,
    priority: params.priority,
    scoutStatus: "unscouted",
    scoutDueDate: null,
    scoutedOverallMin: null,
    scoutedOverallMax: null,
    scoutedPotentialMin: null,
    scoutedPotentialMax: null,
    notes: null,
  });
}

export async function listTransferTargets(careerId: number, clubId: number) {
  return db
    .select({
      id: transferTargets.id,
      playerId: transferTargets.playerId,
      priority: transferTargets.priority,
      scoutStatus: transferTargets.scoutStatus,
      firstName: players.firstName,
      lastName: players.lastName,
      overall: players.overall,
      valueAmount: players.valueAmount,
    })
    .from(transferTargets)
    .leftJoin(players, eq(transferTargets.playerId, players.id))
    .where(and(eq(transferTargets.careerId, careerId), eq(transferTargets.clubId, clubId)))
    .orderBy(desc(transferTargets.priority));
}

export async function submitTransferOffer(params: {
  careerId: number;
  fromClubId: number;
  toClubId: number;
  playerId: number;
  feeAmount: number;
}) {
  const now = new Date();
  await db.insert(transferOffers).values({
    careerId: params.careerId,
    fromClubId: params.fromClubId,
    toClubId: params.toClubId,
    playerId: params.playerId,
    type: "transfer",
    status: "submitted",
    feeAmount: params.feeAmount,
    loanLengthMonths: null,
    wageSplitPercent: null,
    sellOnPercent: null,
    exchangePlayerId: null,
    submittedOn: now,
    respondedOn: null,
    expiresOn: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  await db.insert(inboxMessages).values({
    careerId: params.careerId,
    sentOn: now,
    category: "transfer",
    subject: "Transfer offer submitted",
    body: `Offer lodged for player ${params.playerId}.`,
    isRead: 0,
    actionPayloadJson: null,
  });
}

export async function respondToTransferOffer(params: {
  careerId: number;
  offerId: number;
  accept: boolean;
}) {
  const now = new Date();
  const status = params.accept ? "accepted" : "rejected";
  await db
    .update(transferOffers)
    .set({ status, respondedOn: now })
    .where(eq(transferOffers.id, params.offerId));

  if (!params.accept) {
    return;
  }

  const offerRows = await db
    .select()
    .from(transferOffers)
    .where(eq(transferOffers.id, params.offerId));
  if (offerRows.length === 0) {
    return;
  }

  const offer = offerRows[0];

  await db
    .update(careerRosters)
    .set({
      clubId: offer.toClubId,
      joinedOn: now,
      isListedForTransfer: 0,
      isListedForLoan: 0,
    })
    .where(
      and(
        eq(careerRosters.careerId, params.careerId),
        eq(careerRosters.playerId, offer.playerId)
      )
    );

  await db.insert(transferHistory).values({
    careerId: params.careerId,
    playerId: offer.playerId,
    fromClubId: offer.fromClubId,
    toClubId: offer.toClubId,
    transferType: offer.type,
    feeAmount: offer.feeAmount,
    completedOn: now,
  });

  await db.insert(inboxMessages).values({
    careerId: params.careerId,
    sentOn: now,
    category: "transfer",
    subject: "Transfer completed",
    body: `Player ${offer.playerId} moved clubs for ${offer.feeAmount}.`,
    isRead: 0,
    actionPayloadJson: null,
  });
}

export async function listTransferOffers(careerId: number) {
  return db
    .select({
      id: transferOffers.id,
      playerId: transferOffers.playerId,
      fromClubId: transferOffers.fromClubId,
      toClubId: transferOffers.toClubId,
      status: transferOffers.status,
      feeAmount: transferOffers.feeAmount,
      type: transferOffers.type,
      firstName: players.firstName,
      lastName: players.lastName,
    })
    .from(transferOffers)
    .leftJoin(players, eq(transferOffers.playerId, players.id))
    .where(eq(transferOffers.careerId, careerId))
    .orderBy(desc(transferOffers.submittedOn));
}

export async function generateAiTransferOffers(careerId: number, limit = 6) {
  const rosterRows = await db
    .select({
      playerId: careerRosters.playerId,
      clubId: careerRosters.clubId,
    })
    .from(careerRosters)
    .where(eq(careerRosters.careerId, careerId))
    .limit(limit);

  const clubRows = await db.select({ id: clubs.id }).from(clubs);
  const clubIds = clubRows.map((club) => club.id);

  for (const roster of rosterRows) {
    if (!roster.clubId) {
      continue;
    }
    const targetClub = clubIds[(roster.playerId + 3) % clubIds.length];
    if (targetClub === roster.clubId) {
      continue;
    }
    await submitTransferOffer({
      careerId,
      fromClubId: targetClub,
      toClubId: roster.clubId,
      playerId: roster.playerId,
      feeAmount: 15000000,
    });
  }
}

export async function autoAcceptFirstOffer(careerId: number) {
  const offers = await db
    .select({ id: transferOffers.id })
    .from(transferOffers)
    .where(and(eq(transferOffers.careerId, careerId), eq(transferOffers.status, "submitted")))
    .limit(1);

  if (offers.length === 0) {
    return;
  }

  await respondToTransferOffer({
    careerId,
    offerId: offers[0].id,
    accept: true,
  });
}

export async function getCareerControlledClubId(careerId: number) {
  const rows = await db
    .select({ controlledClubId: careers.controlledClubId })
    .from(careers)
    .where(eq(careers.id, careerId));
  return rows[0]?.controlledClubId ?? null;
}