import { Plus, Trophy, UserMinus, Users } from "lucide-react";
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
      title="Ekipe"
      description="Ustvari šolske ekipe, dodajaj člane iz svoje šole in upravljaj prijave."
    >
      {params.error && (
        <div className="mb-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">

        {/* Create form */}
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2.5">
                <Plus size={16} className="text-[#2BAF3A]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0A2C57]">Nova ekipa</h2>
                <p className="text-xs text-slate-400">{user.schoolName}</p>
              </div>
            </div>

            <form action={createTeamAction} className="space-y-3">
              <input
                name="name"
                required
                placeholder="Ime ekipe"
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium placeholder:text-slate-400"
              />
              <select
                name="sport"
                required
                defaultValue=""
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700"
              >
                <option value="" disabled>Izberi šport</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
              <button className="w-full rounded-[12px] bg-[#2BAF3A] py-2.5 text-sm font-black text-white shadow-md shadow-[#2BAF3A]/20 transition hover:bg-[#249933]">
                Ustvari ekipo
              </button>
            </form>
          </div>

          {teams.length > 0 && (
            <div className="rounded-[22px] bg-[#0A2C57]/5 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Tvoje ekipe</p>
              <div className="space-y-1.5">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between rounded-[10px] bg-white px-3 py-2 text-sm">
                    <span className="font-semibold text-[#0A2C57] truncate">{team.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{team.sport}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teams list */}
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-12 text-center">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-base font-bold text-slate-400">Še nimaš ekip</p>
              <p className="mt-1 text-sm text-slate-400">Ustvari svojo prvo ekipo na levi.</p>
            </div>
          ) : (
            teams.map((team) => {
              const isCreator = team.createdById === user.id;
              const isMember = team.players.some((player) => player.userId === user.id);
              const availableSchoolmates = schoolData.schoolUsers.filter(
                (schoolUser) => !team.players.some((player) => player.userId === schoolUser.id),
              );

              return (
                <div key={team.id} className="rounded-[22px] border border-slate-200 bg-white p-6">
                  {/* Team header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-[#0A2C57]">{team.name}</h2>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                          {team.sport}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {team.schoolName} · ustvaril {team.createdBy.fullName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {team.registrations.length} prijav
                      </span>
                      {!isCreator && isMember && (
                        <form action={leaveTeamAction}>
                          <input type="hidden" name="teamId" value={team.id} />
                          <button className="rounded-[12px] border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                            Zapusti
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
                    {/* Add member */}
                    {isCreator ? (
                      <form action={addSchoolmateToTeamAction} className="rounded-[16px] bg-slate-50 p-4">
                        <input type="hidden" name="teamId" value={team.id} />
                        <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                          Dodaj člana
                        </p>
                        <div className="space-y-2.5">
                          <select
                            name="memberUserId"
                            required
                            defaultValue=""
                            className="w-full rounded-[12px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700"
                          >
                            <option value="" disabled>
                              {availableSchoolmates.length === 0
                                ? "Vsi člani šole so že v ekipi"
                                : "Izberi sošolca…"
                              }
                            </option>
                            {availableSchoolmates.map((schoolUser) => (
                              <option key={schoolUser.id} value={schoolUser.id}>
                                {schoolUser.fullName}
                              </option>
                            ))}
                          </select>
                          <input
                            name="position"
                            placeholder="Pozicija (neobvezno)"
                            className="w-full rounded-[12px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400"
                          />
                          <button
                            disabled={availableSchoolmates.length === 0}
                            className="w-full rounded-[12px] bg-[#0A2C57] py-2.5 text-xs font-black text-white transition hover:bg-[#0d3570] disabled:opacity-40"
                          >
                            Dodaj v ekipo
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="rounded-[16px] bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                        Člane ekipe lahko dodaja samo ustvarjalec ekipe.
                      </div>
                    )}

                    {/* Members list */}
                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-[#2BAF3A]">
                        Člani · {team.players.length}
                      </p>
                      {team.players.length === 0 ? (
                        <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                          Ekipa nima članov
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {team.players.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between rounded-[12px] border border-slate-100 bg-white px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A2C57] text-[9px] font-black text-white">
                                  {player.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#0A2C57]">
                                    {player.fullName}
                                    {player.userId === user.id && (
                                      <span className="ml-1.5 text-[10px] font-black text-[#2BAF3A]">ti</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {player.position || "Član ekipe"}
                                  </p>
                                </div>
                              </div>
                              {isCreator && player.userId !== user.id && (
                                <form action={removePlayerAction}>
                                  <input type="hidden" name="playerId" value={player.id} />
                                  <button className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
                                    <UserMinus size={14} />
                                  </button>
                                </form>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
