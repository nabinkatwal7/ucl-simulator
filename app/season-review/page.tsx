import { getUniverseSnapshot } from "@/lib/database/queries";

export default async function SeasonReviewPage() {
  const snapshot = await getUniverseSnapshot();
  const season = snapshot.currentSeason ?? snapshot.history[0];
  const clubs = new Map(snapshot.clubs.map((club) => [club.id, club]));
  const players = new Map(
    snapshot.players.map((player) => [player.id, player])
  );

  if (!snapshot.currentSeason) {
    return (
      <div className="panel p-6 text-slate-300">
        No active or archived season review is available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="panel-title">Season Review</div>
        <h1 className="mt-3 text-4xl font-black text-white">
          {snapshot.currentSeason.yearStart}/
          {String(snapshot.currentSeason.yearEnd).slice(-2)} review
        </h1>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6">
          <div className="panel-title">Headlines</div>
          <div className="mt-4 space-y-3">
            {snapshot.currentSeason.review.headlines.map((headline, index) => (
              <div
                key={`${headline}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200"
              >
                {headline}
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <div className="panel-title">Awards</div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div>
              Champion:{" "}
              {clubs.get(snapshot.currentSeason.championClubId ?? "")?.name ??
                "Pending"}
            </div>
            <div>
              Runner-up:{" "}
              {clubs.get(snapshot.currentSeason.runnerUpClubId ?? "")?.name ??
                "Pending"}
            </div>
            <div>
              Top scorer:{" "}
              {players.get(
                snapshot.currentSeason.awards.topScorerPlayerId ?? ""
              )?.name ?? "Pending"}
            </div>
            <div>
              Player of tournament:{" "}
              {players.get(
                snapshot.currentSeason.awards.playerOfTournamentId ?? ""
              )?.name ?? "Pending"}
            </div>
            <div>
              Best goalkeeper:{" "}
              {players.get(
                snapshot.currentSeason.awards.bestGoalkeeperPlayerId ?? ""
              )?.name ?? "Pending"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
