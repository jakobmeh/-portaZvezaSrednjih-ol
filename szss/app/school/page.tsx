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
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl tracking-tight text-[#0A2C57]">{data.currentUser.schoolName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Potrjeni uporabniki iz tvoje šole se lahko dodajajo v ekipe preko dropdown izbire.
          </p>
          <div className="mt-5 space-y-3">
            {data.schoolUsers.map((schoolUser) => (
              <div key={schoolUser.id} className="rounded-[24px] bg-slate-50 p-4">
                <p className="font-semibold text-[#0A2C57]">{schoolUser.fullName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {schoolUser.email}
                  {schoolUser.id === user.id ? " · ti" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl tracking-tight text-[#0A2C57]">Ekipe tvoje šole</h2>
          <div className="mt-5 space-y-4">
            {data.schoolTeams.map((team) => (
              <div key={team.id} className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0A2C57]">{team.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {team.sport} · ustvaril {team.createdBy.fullName}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">
                    {team.registrations.length} prijav
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.players.map((player) => (
                    <span key={player.id} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                      {player.fullName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
