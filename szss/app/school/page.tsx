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
      description={data.currentUser.schoolName}
    >
      <div className="grid gap-5 xl:grid-cols-2">

        {/* Člani šole */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} style={{ color: "#2baf3a" }} />
            <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Člani ({data.schoolUsers.length})
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Ti uporabniki se lahko dodajajo v šolske ekipe.
          </p>
          <div className="space-y-2">
            {data.schoolUsers.map((su) => (
              <div
                key={su.id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: su.id === user.id ? "rgba(43,175,58,0.1)" : "var(--bg-surface)",
                  border: `1px solid ${su.id === user.id ? "rgba(43,175,58,0.25)" : "var(--border)"}`,
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style={{ background: "rgba(43,175,58,0.25)", color: "#6ee77a" }}>
                  {su.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {su.fullName}
                    {su.id === user.id && (
                      <span className="ml-2 text-[10px] font-black" style={{ color: "#6ee77a" }}>ti</span>
                    )}
                  </p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    <Mail size={9} />
                    {su.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ekipe šole */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} style={{ color: "#f59e0b" }} />
            <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Ekipe ({data.schoolTeams.length})
            </h2>
          </div>
          {data.schoolTeams.length === 0 ? (
            <div className="rounded-xl py-10 text-center" style={{ background: "var(--bg-surface)", border: "1px dashed var(--border-strong)" }}>
              <Users size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Šola še nima ekip.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.schoolTeams.map((team) => (
                <div key={team.id} className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{team.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>ustvaril {team.createdBy.fullName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-blue">{team.sport}</span>
                      <span className="badge badge-gray">{team.registrations.length} prijav</span>
                    </div>
                  </div>
                  {team.players.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      {team.players.map((p) => (
                        <span key={p.id} className="badge badge-gray">{p.fullName}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
