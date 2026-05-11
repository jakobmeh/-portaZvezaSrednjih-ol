import { Plus, UserMinus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SchoolSelect } from "@/components/school-select";
import { FormSelect } from "@/components/form-select";
import { addSchoolmateToTeamAction, createTeamAction, leaveTeamAction, removePlayerAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getSchoolData, getTeamsForUser } from "@/lib/data";
import { SPORTS } from "@/lib/utils";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [teams, schoolData] = await Promise.all([getTeamsForUser(user.id), getSchoolData(user.id)]);
  const params = await searchParams;

  return (
    <AppShell
      user={user}
      activePath="/teams"
      title="Ekipe"
      description="Ustvari ekipe in dodaj sošolce."
    >
      {params.error && (
        <div className="mb-5 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          {params.error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">

        {/* Ustvari ekipo */}
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Plus size={14} style={{ color: "#6ee77a" }} />
              <h2 className="font-black text-sm">Nova ekipa</h2>
            </div>
            <form action={createTeamAction} className="space-y-3">
              <div>
                <label className="label-text">Ime ekipe</label>
                <input name="name" required className="field" placeholder="npr. Sokoli FTV" />
              </div>
              <div>
                <label className="label-text">Šport</label>
                <SchoolSelect
                  schools={SPORTS}
                  name="sport"
                  placeholder="Izberi šport..."
                />
              </div>
              <button className="btn-primary w-full py-2.5">Ustvari ekipo</button>
            </form>
          </div>

          <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
            Ekipe ustvarjaš za svojo šolo ({user.schoolName}). Dodajaš lahko samo sošolce.
          </p>
        </div>

        {/* Seznam ekip */}
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="rounded-xl py-16 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Users size={28} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Nimaš ekip.</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Ustvari svojo prvo ekipo.</p>
            </div>
          ) : (
            teams.map((team) => {
              const isCreator = team.createdById === user.id;
              const isMember = team.players.some((p) => p.userId === user.id);
              const availableSchoolmates = schoolData.schoolUsers.filter(
                (su) => !team.players.some((p) => p.userId === su.id),
              );

              return (
                <div key={team.id} className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-lg" style={{ fontFamily: "var(--font-heading)" }}>{team.name}</h2>
                        <span className="badge badge-blue">{team.sport}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {team.schoolName} · ustvaril {team.createdBy.fullName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{team.registrations.length} prijav</span>
                      {!isCreator && isMember && (
                        <form action={leaveTeamAction}>
                          <input type="hidden" name="teamId" value={team.id} />
                          <button className="badge badge-red cursor-pointer py-1 px-2.5">Zapusti</button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                    {/* Dodaj člana */}
                    {isCreator ? (
                      <form action={addSchoolmateToTeamAction} className="rounded-xl p-4 space-y-2.5" style={{ background: "var(--bg-surface)" }}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Dodaj člana</p>
                        <FormSelect
                          name="memberUserId"
                          required
                          placeholder={availableSchoolmates.length === 0 ? "Vsi sošolci so že v ekipi" : "Izberi sošolca..."}
                          options={availableSchoolmates.map((su) => ({ label: su.fullName, value: su.id }))}
                        />
                        <input name="position" className="field" placeholder="Pozicija (neobvezno)" />
                        <button disabled={availableSchoolmates.length === 0} className="btn-primary w-full py-2 text-sm disabled:opacity-40">
                          Dodaj v ekipo
                        </button>
                      </form>
                    ) : (
                      <div className="rounded-xl p-4 text-xs" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                        Člane dodaja samo ustvarjalec ekipe.
                      </div>
                    )}

                    {/* Člani */}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                        Člani · {team.players.length}
                      </p>
                      {team.players.length === 0 ? (
                        <div className="rounded-xl p-4 text-center text-xs" style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px dashed var(--border-strong)" }}>
                          Ekipa nima članov
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)" }}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-black" style={{ background: "rgba(43,175,58,0.25)", color: "#6ee77a" }}>
                                  {player.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">
                                    {player.fullName}
                                    {player.userId === user.id && (
                                      <span className="ml-1.5 text-[10px] font-black" style={{ color: "#6ee77a" }}>ti</span>
                                    )}
                                  </p>
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{player.position ?? "Član"}</p>
                                </div>
                              </div>
                              {isCreator && player.userId !== user.id && (
                                <form action={removePlayerAction}>
                                  <input type="hidden" name="playerId" value={player.id} />
                                  <button className="p-1.5 rounded-lg transition-all hover:text-red-400" style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}>
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
