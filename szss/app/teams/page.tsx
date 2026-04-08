import { AppShell } from "@/components/app-shell";
import {
  addSchoolmateToTeamAction,
  createTeamAction,
  leaveTeamAction,
  removePlayerAction,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getSchoolData, getTeamsForUser } from "@/lib/data";
import { SPORTS } from "@/lib/utils";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const [teams, schoolData] = await Promise.all([getTeamsForUser(user.id), getSchoolData(user.id)]);
  const params = await searchParams;

  return (
    <AppShell
      user={user}
      activePath="/teams"
      title="Upravljanje ekip"
      description="Ustvari šolske ekipe, dodajaj člane iz svoje šole in po potrebi zapusti ekipo."
    >
      {params.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl tracking-tight text-[#0A2C57]">Nova ekipa</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ekipa bo vezana na tvojo šolo: <strong>{user.schoolName}</strong>.
          </p>
          <form action={createTeamAction} className="mt-5 space-y-4">
            <input
              name="name"
              required
              placeholder="Ime ekipe"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
            <select
              name="sport"
              required
              defaultValue=""
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <option value="" disabled>
                Izberi šport
              </option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
            <button className="w-full rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white">
              Ustvari ekipo
            </button>
          </form>
        </section>

        <section className="space-y-6">
          {teams.map((team) => {
            const isCreator = team.createdById === user.id;
            const isMember = team.players.some((player) => player.userId === user.id);
            const availableSchoolmates = schoolData.schoolUsers.filter(
              (schoolUser) => !team.players.some((player) => player.userId === schoolUser.id),
            );

            return (
              <div key={team.id} className="rounded-[28px] border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl tracking-tight text-[#0A2C57]">{team.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {team.schoolName} · {team.sport}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ustvaril: {team.createdBy.fullName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                      {team.registrations.length} prijav na turnir
                    </div>
                    {!isCreator && isMember ? (
                      <form action={leaveTeamAction}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <button className="rounded-2xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700">
                          Zapusti ekipo
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  {isCreator ? (
                    <form action={addSchoolmateToTeamAction} className="rounded-[24px] bg-slate-50 p-4">
                      <input type="hidden" name="teamId" value={team.id} />
                      <p className="text-sm font-semibold text-[#0A2C57]">Dodaj člana iz svoje šole</p>
                      <div className="mt-4 space-y-3">
                        <select
                          name="memberUserId"
                          required
                          defaultValue=""
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <option value="" disabled>
                            Izberi uporabnika iz svoje šole
                          </option>
                          {availableSchoolmates.map((schoolUser) => (
                            <option key={schoolUser.id} value={schoolUser.id}>
                              {schoolUser.fullName}
                            </option>
                          ))}
                        </select>
                        <input
                          name="position"
                          placeholder="Pozicija v ekipi"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        />
                        <button className="w-full rounded-2xl bg-[#0A2C57] px-4 py-3 text-sm font-semibold text-white">
                          Dodaj v ekipo
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      Člane ekipe lahko dodaja samo ustvarjalec ekipe.
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2BAF3A]">
                      Člani ekipe
                    </p>
                    <div className="mt-4 space-y-3">
                      {team.players.map((player) => (
                        <div
                          key={player.id}
                          className="flex flex-col gap-3 rounded-[24px] border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#0A2C57]">{player.fullName}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {player.position ? player.position : "Član ekipe"}
                              {player.userId === user.id ? " · ti" : ""}
                            </p>
                          </div>
                          {isCreator && player.userId !== user.id ? (
                            <form action={removePlayerAction}>
                              <input type="hidden" name="playerId" value={player.id} />
                              <button className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">
                                Odstrani
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
