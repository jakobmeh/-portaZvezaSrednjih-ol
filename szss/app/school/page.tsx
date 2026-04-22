import { Building2, Mail, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getSchoolData } from "@/lib/data";

export default async function SchoolPage() {
  const user = await requireUser();
  const data = await getSchoolData(user.id);

  return (
    <AppShell
      user={user}
      activePath="/school"
      title="Moja šola"
      description="Pregled vseh potrjenih uporabnikov iz tvoje šole ter ekip, ki nastopajo pod isto šolo."
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">

        {/* Members */}
        <section className="rounded-[22px] border border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#0A2C57]/8 p-2.5">
              <Users size={17} className="text-[#0A2C57]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A2C57]">{data.currentUser.schoolName}</h2>
              <p className="text-xs text-slate-400">Potrjeni člani v sistemu</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Ti uporabniki se lahko dodajajo v šolske ekipe.
          </p>

          <div className="mt-4 space-y-2">
            {data.schoolUsers.map((schoolUser) => (
              <div
                key={schoolUser.id}
                className={`flex items-center gap-3 rounded-[14px] p-3.5 ${
                  schoolUser.id === user.id
                    ? "bg-[#2BAF3A]/8 ring-1 ring-[#2BAF3A]/20"
                    : "bg-white ring-1 ring-slate-100"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A2C57] text-[10px] font-black text-white">
                  {schoolUser.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0A2C57]">
                    {schoolUser.fullName}
                    {schoolUser.id === user.id && (
                      <span className="ml-2 text-[10px] font-black text-[#2BAF3A]">ti</span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Mail size={10} />
                    {schoolUser.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Teams */}
        <section className="rounded-[22px] border border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <Building2 size={17} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A2C57]">Ekipe tvoje šole</h2>
              <p className="text-xs text-slate-400">Vse ekipe registrirane pod tvojo šolo</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {data.schoolTeams.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-slate-200 bg-white p-6 text-center">
                <Users size={24} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-400">Šola še nima ekip</p>
              </div>
            ) : (
              data.schoolTeams.map((team) => (
                <div key={team.id} className="rounded-[16px] bg-white p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#0A2C57]">{team.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Ustvaril {team.createdBy.fullName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        {team.sport}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                        {team.registrations.length} prijav
                      </span>
                    </div>
                  </div>

                  {team.players.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                      {team.players.map((player) => (
                        <span
                          key={player.id}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {player.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
