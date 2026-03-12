import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { careerClubState, clubs } from "@/server/db/schema";
import { advanceDay } from "@/server/services/calendarService";
import { createCareer, listCareers } from "@/server/services/careerService";
import {
  generateSeasonFixtures,
  listUpcomingFixturesWithNames,
  simulateNextFixture,
} from "@/server/services/competitionService";
import { listInboxMessagesByCareerIds } from "@/server/services/inboxService";
import { listSquadForCareer } from "@/server/services/squadService";
import { getPrimaryCompetitionId, listStandings } from "@/server/services/standingsService";
import {
  addTransferTarget,
  autoAcceptFirstOffer,
  generateAiTransferOffers,
  getCareerControlledClubId,
  listTransferMarket,
  listTransferOffers,
  listTransferTargets,
  respondToTransferOffer,
  submitTransferOffer,
} from "@/server/services/transferService";
import { renewContract } from "@/server/services/contractService";

export const dynamic = "force-dynamic";

function formatDate(value?: string | Date | null) {
  if (!value) return "TBD";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.toString().slice(0, 10);
}

function formatMoney(amount?: number | null) {
  if (!amount) return "GBP 0";
  if (amount >= 1000000) {
    return `GBP ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `GBP ${(amount / 1000).toFixed(1)}K`;
  }
  return `GBP ${amount}`;
}

async function createCareerAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const managerProfileName = String(formData.get("managerProfileName") ?? "").trim();
  const controlledClubId = Number(formData.get("controlledClubId"));
  if (!name || !managerProfileName || !controlledClubId) return;
  await createCareer({ name, managerProfileName, controlledClubId });
  revalidatePath("/");
}

async function advanceDayAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  if (!careerId) return;
  await advanceDay(careerId);
  revalidatePath("/");
}

async function generateSeasonAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  if (!careerId) return;
  await generateSeasonFixtures(careerId);
  revalidatePath("/");
}

async function simulateNextFixtureAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  if (!careerId) return;
  await simulateNextFixture(careerId);
  revalidatePath("/");
}

async function addTransferTargetAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  const clubId = Number(formData.get("clubId"));
  const playerId = Number(formData.get("playerId"));
  const priority = Number(formData.get("priority") ?? 2);
  if (!careerId || !clubId || !playerId) return;
  await addTransferTarget({ careerId, clubId, playerId, priority });
  revalidatePath("/");
}

async function submitTransferOfferAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  const fromClubId = Number(formData.get("fromClubId"));
  const toClubId = Number(formData.get("toClubId"));
  const playerId = Number(formData.get("playerId"));
  const feeAmount = Math.max(0, Number(formData.get("feeAmount") ?? 0));
  if (!careerId || !fromClubId || !toClubId || !playerId) return;
  await submitTransferOffer({
    careerId,
    fromClubId,
    toClubId,
    playerId,
    feeAmount,
  });
  revalidatePath("/");
}

async function respondTransferOfferAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  const offerId = Number(formData.get("offerId"));
  const accept = String(formData.get("accept")) === "true";
  if (!careerId || !offerId) return;
  await respondToTransferOffer({ careerId, offerId, accept });
  revalidatePath("/");
}

async function generateAiOffersAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  if (!careerId) return;
  await generateAiTransferOffers(careerId, 6);
  revalidatePath("/");
}

async function autoAcceptFirstOfferAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  if (!careerId) return;
  await autoAcceptFirstOffer(careerId);
  revalidatePath("/");
}

async function renewContractAction(formData: FormData) {
  "use server";
  const careerId = Number(formData.get("careerId"));
  const playerId = Number(formData.get("playerId"));
  const clubId = Number(formData.get("clubId"));
  const contractYears = Number(formData.get("contractYears") ?? 3);
  const weeklyWage = Number(formData.get("weeklyWage") ?? 50000);
  const signingBonus = Number(formData.get("signingBonus") ?? 250000);
  const squadRole = String(formData.get("squadRole") ?? "rotation");
  if (!careerId || !playerId || !clubId) return;
  await renewContract({
    careerId,
    playerId,
    clubId,
    contractYears,
    weeklyWage,
    signingBonus,
    squadRole,
  });
  revalidatePath("/");
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { careerId?: string };
}) {
  const careerRows = await listCareers();
  const activeCareerId = Number(searchParams?.careerId) || careerRows[0]?.id || 0;
  const activeCareer = careerRows.find((row) => row.id === activeCareerId) ?? careerRows[0];

  const clubRows = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .orderBy(asc(clubs.name));

  const controlledClubId = activeCareerId
    ? await getCareerControlledClubId(activeCareerId)
    : null;

  const clubStateRows =
    activeCareerId && controlledClubId
      ? await db
          .select({
            transferBudget: careerClubState.transferBudget,
            wageBudget: careerClubState.wageBudget,
            weeklyWageSpend: careerClubState.weeklyWageSpend,
            managerRating: careerClubState.managerRating,
          })
          .from(careerClubState)
          .where(
            and(
              eq(careerClubState.careerId, activeCareerId),
              eq(careerClubState.clubId, controlledClubId)
            )
          )
          .limit(1)
      : [];

  const clubState = clubStateRows[0];

  const inboxMap = await listInboxMessagesByCareerIds(
    activeCareerId ? [activeCareerId] : [],
    5
  );
  const inbox = activeCareerId ? inboxMap.get(activeCareerId) ?? [] : [];

  const squad = activeCareerId ? await listSquadForCareer(activeCareerId) : [];
  const featuredPlayer = squad[0] ?? null;

  const upcomingFixtures = activeCareerId
    ? await listUpcomingFixturesWithNames(activeCareerId, 6)
    : [];
  const nextFixture = upcomingFixtures[0];

  const primaryCompetitionId = activeCareerId
    ? await getPrimaryCompetitionId(activeCareerId)
    : null;
  const standings = primaryCompetitionId ? await listStandings(primaryCompetitionId, 8) : [];

  const transferMarket = activeCareerId ? await listTransferMarket(activeCareerId, 12) : [];
  const transferTargets =
    activeCareerId && controlledClubId
      ? await listTransferTargets(activeCareerId, controlledClubId)
      : [];
  const transferOffers = activeCareerId ? await listTransferOffers(activeCareerId) : [];

  const clubMap = new Map(clubRows.map((club) => [club.id, club.name]));

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-md border border-white/10 bg-[var(--panel)] p-6 shadow-[0_0_30px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Career Hub
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeCareer ? activeCareer.name : "No career loaded"}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Manager: {activeCareer?.managerProfileName ?? "TBD"} | Club:{" "}
              {activeCareer?.clubName ?? "Unassigned"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] px-4 py-2">
              <div className="text-xs uppercase text-[var(--text-muted)]">Date</div>
              <div className="text-base">{formatDate(activeCareer?.currentDate)}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] px-4 py-2">
              <div className="text-xs uppercase text-[var(--text-muted)]">Transfer Budget</div>
              <div className="text-base">{formatMoney(clubState?.transferBudget)}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] px-4 py-2">
              <div className="text-xs uppercase text-[var(--text-muted)]">Wage Budget</div>
              <div className="text-base">{formatMoney(clubState?.wageBudget)}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] px-4 py-2">
              <div className="text-xs uppercase text-[var(--text-muted)]">Manager Rating</div>
              <div className="text-base">{clubState?.managerRating ?? 0}</div>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap items-center gap-2">
          {["Central", "Squad", "Transfers", "Office", "Season"].map((tab) => (
            <span
              key={tab}
              className="rounded-sm border border-white/10 bg-[var(--panel)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]"
            >
              {tab}
            </span>
          ))}
        </nav>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Central Hub</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Next fixture:{" "}
                    {nextFixture
                      ? `${nextFixture.homeName} vs ${nextFixture.awayName}`
                      : "No fixtures scheduled"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={advanceDayAction}>
                    <input type="hidden" name="careerId" value={activeCareerId} />
                    <button
                      type="submit"
                      className="rounded-sm bg-[var(--pitch-green)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                    >
                      Advance Day
                    </button>
                  </form>
                  <form action={simulateNextFixtureAction}>
                    <input type="hidden" name="careerId" value={activeCareerId} />
                    <button
                      type="submit"
                      className="rounded-sm border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      Sim Next Fixture
                    </button>
                  </form>
                  <form action={generateSeasonAction}>
                    <input type="hidden" name="careerId" value={activeCareerId} />
                    <button
                      type="submit"
                      className="rounded-sm border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      Generate Season
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Upcoming Fixtures
                </h3>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  {upcomingFixtures.length === 0 ? (
                    <p className="text-[var(--text-muted)]">No fixtures yet.</p>
                  ) : (
                    upcomingFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="flex items-center justify-between rounded-sm border border-white/5 bg-[var(--panel-alt)] px-3 py-2"
                      >
                        <div>
                          <div className="font-medium">
                            {fixture.homeName} vs {fixture.awayName}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {formatDate(fixture.scheduledDate)}
                          </div>
                        </div>
                        <span className="text-xs uppercase text-[var(--text-muted)]">
                          {fixture.resultStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Standings Snapshot
                </h3>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  {standings.length === 0 ? (
                    <p className="text-[var(--text-muted)]">No standings yet.</p>
                  ) : (
                    standings.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between border-b border-white/5 pb-2"
                      >
                        <span>
                          {row.clubName ?? "Club"} ({row.played})
                        </span>
                        <span className="text-[var(--pitch-green)]">{row.points} pts</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Inbox
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {inbox.length === 0 ? (
                  <p className="text-[var(--text-muted)]">Inbox empty.</p>
                ) : (
                  inbox.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-sm border border-white/5 bg-[var(--panel-alt)] px-3 py-2"
                    >
                      <div className="text-xs uppercase text-[var(--text-muted)]">
                        {message.category}
                      </div>
                      <div className="font-semibold">{message.subject}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {formatDate(message.sentOn)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Squad Snapshot
              </h3>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {squad.length === 0 ? (
                  <p className="text-[var(--text-muted)]">No squad data.</p>
                ) : (
                  squad.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between border-b border-white/5 pb-2"
                    >
                      <span>
                        {player.firstName} {player.lastName} ({player.primaryPosition})
                      </span>
                      <span className="text-[var(--text-muted)]">
                        OVR {player.overall} | Morale {player.morale} | Fit {player.fitness}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Featured Player
              </h3>
              {featuredPlayer ? (
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <div className="rounded-sm border border-white/5 bg-[var(--panel-alt)] px-3 py-2">
                    <div className="text-base font-semibold">
                      {featuredPlayer.firstName} {featuredPlayer.lastName}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {featuredPlayer.primaryPosition} | OVR {featuredPlayer.overall}
                    </div>
                  </div>
                  <form action={renewContractAction} className="flex flex-col gap-2">
                    <input type="hidden" name="careerId" value={activeCareerId} />
                    <input type="hidden" name="playerId" value={featuredPlayer.id} />
                    <input type="hidden" name="clubId" value={controlledClubId ?? ""} />
                    <div className="flex gap-2">
                      <input
                        name="contractYears"
                        defaultValue={3}
                        className="w-20 rounded-sm border border-white/10 bg-transparent px-2 py-1 text-xs"
                      />
                      <input
                        name="weeklyWage"
                        defaultValue={50000}
                        className="w-28 rounded-sm border border-white/10 bg-transparent px-2 py-1 text-xs"
                      />
                      <input
                        name="signingBonus"
                        defaultValue={250000}
                        className="w-28 rounded-sm border border-white/10 bg-transparent px-2 py-1 text-xs"
                      />
                      <input
                        name="squadRole"
                        defaultValue="rotation"
                        className="w-28 rounded-sm border border-white/10 bg-transparent px-2 py-1 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-sm bg-[var(--cyan-blue)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                    >
                      Renew Contract
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-4 text-[var(--text-muted)]">No featured player.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Transfers Hub</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Shortlist targets, submit bids, and respond to offers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generateAiOffersAction}>
                <input type="hidden" name="careerId" value={activeCareerId} />
                <button
                  type="submit"
                  className="rounded-sm border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Generate AI Offers
                </button>
              </form>
              <form action={autoAcceptFirstOfferAction}>
                <input type="hidden" name="careerId" value={activeCareerId} />
                <button
                  type="submit"
                  className="rounded-sm border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Auto Accept First Offer
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Transfer Market
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {transferMarket.length === 0 ? (
                  <p className="text-[var(--text-muted)]">No market data.</p>
                ) : (
                  transferMarket.map((player) => (
                    <div key={player.playerId} className="rounded-sm border border-white/5 p-2">
                      <div className="font-semibold">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        OVR {player.overall} | {formatMoney(player.valueAmount)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <form action={addTransferTargetAction}>
                          <input type="hidden" name="careerId" value={activeCareerId} />
                          <input type="hidden" name="clubId" value={controlledClubId ?? ""} />
                          <input type="hidden" name="playerId" value={player.playerId} />
                          <input type="hidden" name="priority" value={2} />
                          <button
                            type="submit"
                            className="rounded-sm border border-white/15 px-3 py-1 text-xs"
                          >
                            Add Target
                          </button>
                        </form>
                        <form action={submitTransferOfferAction} className="flex items-center gap-2">
                          <input type="hidden" name="careerId" value={activeCareerId} />
                          <input type="hidden" name="fromClubId" value={controlledClubId ?? ""} />
                          <input type="hidden" name="toClubId" value={player.clubId ?? ""} />
                          <input type="hidden" name="playerId" value={player.playerId} />
                          <input
                            name="feeAmount"
                            defaultValue={player.valueAmount ?? 0}
                            className="w-24 rounded-sm border border-white/10 bg-transparent px-2 py-1 text-xs"
                          />
                          <button
                            type="submit"
                            className="rounded-sm bg-[var(--electric-purple)] px-3 py-1 text-xs font-semibold"
                          >
                            Submit Bid
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Shortlist
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {transferTargets.length === 0 ? (
                  <p className="text-[var(--text-muted)]">No targets yet.</p>
                ) : (
                  transferTargets.map((target) => (
                    <div key={target.id} className="rounded-sm border border-white/5 p-2">
                      <div className="font-semibold">
                        {target.firstName} {target.lastName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        OVR {target.overall} | {formatMoney(target.valueAmount)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Priority {target.priority} | {target.scoutStatus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Incoming Offers
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {transferOffers.length === 0 ? (
                  <p className="text-[var(--text-muted)]">No offers yet.</p>
                ) : (
                  transferOffers.map((offer) => (
                    <div key={offer.id} className="rounded-sm border border-white/5 p-2">
                      <div className="font-semibold">
                        {offer.firstName} {offer.lastName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        From {clubMap.get(offer.fromClubId) ?? offer.fromClubId} to{" "}
                        {clubMap.get(offer.toClubId) ?? offer.toClubId}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Status: {offer.status} | Fee {formatMoney(offer.feeAmount ?? 0)}
                      </div>
                      {offer.status === "submitted" ? (
                        <div className="mt-2 flex gap-2">
                          <form action={respondTransferOfferAction}>
                            <input type="hidden" name="careerId" value={activeCareerId} />
                            <input type="hidden" name="offerId" value={offer.id} />
                            <input type="hidden" name="accept" value="true" />
                            <button
                              type="submit"
                              className="rounded-sm bg-[var(--pitch-green)] px-3 py-1 text-xs font-semibold text-black"
                            >
                              Accept
                            </button>
                          </form>
                          <form action={respondTransferOfferAction}>
                            <input type="hidden" name="careerId" value={activeCareerId} />
                            <input type="hidden" name="offerId" value={offer.id} />
                            <input type="hidden" name="accept" value="false" />
                            <button
                              type="submit"
                              className="rounded-sm border border-white/15 px-3 py-1 text-xs"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-white/10 bg-[var(--panel)] p-6">
          <h2 className="text-lg font-semibold">Careers</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Select Career
              </h3>
              <form className="mt-3 flex flex-col gap-3" method="get">
                <select
                  name="careerId"
                  defaultValue={activeCareer?.id ?? ""}
                  className="rounded-sm border border-white/10 bg-transparent px-2 py-2 text-sm"
                >
                  {careerRows.map((career) => (
                    <option key={career.id} value={career.id}>
                      {career.name} - {career.clubName}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-sm border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Load Career
                </button>
              </form>
            </div>

            <div className="rounded-md border border-white/10 bg-[var(--panel-alt)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Create Career
              </h3>
              <form action={createCareerAction} className="mt-3 flex flex-col gap-3">
                <input
                  name="name"
                  placeholder="Career name"
                  className="rounded-sm border border-white/10 bg-transparent px-2 py-2 text-sm"
                />
                <input
                  name="managerProfileName"
                  placeholder="Manager name"
                  className="rounded-sm border border-white/10 bg-transparent px-2 py-2 text-sm"
                />
                <select
                  name="controlledClubId"
                  className="rounded-sm border border-white/10 bg-transparent px-2 py-2 text-sm"
                >
                  {clubRows.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-sm bg-[var(--pitch-green)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                >
                  Start Career
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}