import { revalidatePath } from "next/cache";
import { advanceDay } from "../server/services/calendarService";
import { createCareer, listCareers } from "../server/services/careerService";
import { listInboxMessagesByCareerIds } from "../server/services/inboxService";
import { listClubs } from "../server/services/referenceService";

async function createCareerAction(formData: FormData) {
  "use server";
  const name = String(formData.get("careerName") ?? "").trim();
  const managerProfileName = String(formData.get("managerName") ?? "").trim();
  const clubIdRaw = String(formData.get("controlledClubId") ?? "");
  const controlledClubId = Number.parseInt(clubIdRaw, 10);

  if (!name || !managerProfileName || Number.isNaN(controlledClubId)) {
    return;
  }

  await createCareer({
    name,
    managerProfileName,
    controlledClubId,
  });

  revalidatePath("/");
}

async function advanceDayAction(formData: FormData) {
  "use server";
  const careerIdRaw = String(formData.get("careerId") ?? "");
  const careerId = Number.parseInt(careerIdRaw, 10);

  if (Number.isNaN(careerId)) {
    return;
  }

  await advanceDay(careerId);
  revalidatePath("/");
}

export default async function Home() {
  const [clubs, careers] = await Promise.all([listClubs(), listCareers()]);
  const inboxByCareerId = await listInboxMessagesByCareerIds(
    careers.map((career) => career.id),
    5
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-8 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            FIFA 19-Style Career Mode
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Create a Manager Career
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Seed data is loaded from SQLite. Create a career to initialize club state
            and budgets.
          </p>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <form action={createCareerAction} className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Career name
              <input
                name="careerName"
                placeholder="New Horizon FC"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Manager name
              <input
                name="managerName"
                placeholder="Jordan Pierce"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Club
              <select
                name="controlledClubId"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select a club
                </option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} {club.leagueName ? `(${club.leagueName})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950"
              >
                Create career
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Existing careers</h2>
          <div className="mt-4 grid gap-4">
            {careers.length === 0 ? (
              <p className="text-sm text-slate-400">No careers created yet.</p>
            ) : (
              careers.map((career) => {
                const messages = inboxByCareerId.get(career.id) ?? [];
                return (
                  <div
                    key={career.id}
                    className="rounded-md border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {career.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Manager: {career.managerProfileName} · Club: {career.clubName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Current date: {career.currentDate}
                        </p>
                        <form action={advanceDayAction} className="mt-2">
                          <input type="hidden" name="careerId" value={career.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-900"
                          >
                            Advance day
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Inbox
                      </p>
                      {messages.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">
                          No messages yet.
                        </p>
                      ) : (
                        <div className="mt-2 grid gap-2">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className="rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2"
                            >
                              <p className="text-xs font-semibold text-white">
                                {message.subject}
                              </p>
                              <p className="text-xs text-slate-400">{message.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}