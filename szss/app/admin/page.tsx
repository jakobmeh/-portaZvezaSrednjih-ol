import { Check, ShieldCheck, Trophy, UserCheck, Users, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { approveUserAction, rejectUserAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/data";
import { formatCompactDate, getApprovalLabel, getRoleLabel, getTournamentStatus } from "@/lib/utils";

export default async function AdminPage() {
  const user = await requireAdmin();
  const data = await getAdminData();

  return (
    <AppShell
      user={user}
      activePath="/admin"
      title="Admin panel"
      description="Odobritev registracij, pregled turnirjev in upravljanje uporabnikov."
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">

        {/* Pending registrations */}
        <section className="rounded-[22px] border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <UserCheck size={17} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A2C57]">Registracije v čakanju</h2>
              <p className="text-xs text-slate-400">
                {data.pendingUsers.length} {data.pendingUsers.length === 1 ? "zahtevek" : "zahtevkov"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {data.pendingUsers.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <ShieldCheck size={28} className="mx-auto text-[#2BAF3A]/50" />
                <p className="mt-2 text-sm font-bold text-slate-400">Ni registracij v čakanju</p>
              </div>
            ) : (
              data.pendingUsers.map((pending) => (
                <div key={pending.id} className="rounded-[18px] border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A2C57] text-xs font-black text-white">
                        {pending.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-[#0A2C57]">{pending.fullName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{pending.email}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                            {pending.schoolName}
                          </span>
                          <span className="rounded-full bg-[#0A2C57]/8 px-2.5 py-0.5 text-[11px] font-bold text-[#0A2C57]">
                            {getRoleLabel(pending.role)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pending.schoolCardImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pending.schoolCardImage}
                        alt={`Šolska kartica ${pending.fullName}`}
                        className="h-24 w-40 rounded-[14px] object-cover ring-1 ring-slate-200"
                      />
                    )}
                  </div>

                  <div className="mt-4 flex gap-2.5 border-t border-slate-100 pt-4">
                    <form action={approveUserAction}>
                      <input type="hidden" name="userId" value={pending.id} />
                      <button className="flex items-center gap-1.5 rounded-[12px] bg-[#2BAF3A] px-4 py-2 text-xs font-black text-white shadow-md shadow-[#2BAF3A]/20 transition hover:bg-[#249933]">
                        <Check size={13} />
                        Odobri
                      </button>
                    </form>
                    <form action={rejectUserAction}>
                      <input type="hidden" name="userId" value={pending.id} />
                      <button className="flex items-center gap-1.5 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100">
                        <X size={13} />
                        Zavrni
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-5">

          {/* Tournaments */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                <Trophy size={15} className="text-[#2BAF3A]" />
              </div>
              <h2 className="text-base font-black text-[#0A2C57]">Objavljeni turnirji</h2>
            </div>
            <div className="space-y-2">
              {data.tournaments.length === 0 ? (
                <p className="text-sm text-slate-400">Ni objavljenih turnirjev.</p>
              ) : (
                data.tournaments.map((tournament) => {
                  const status = getTournamentStatus({
                    date: tournament.date,
                    maxTeams: tournament.maxTeams,
                    registeredTeams: tournament.registrations.length,
                  });
                  return (
                    <div key={tournament.id} className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-[#0A2C57]">{tournament.title}</p>
                        <p className="text-xs text-slate-400">{tournament.organizer.fullName}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Recent users */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="rounded-xl bg-[#0A2C57]/8 p-2">
                <Users size={15} className="text-[#0A2C57]" />
              </div>
              <h2 className="text-base font-black text-[#0A2C57]">Zadnji uporabniki</h2>
            </div>
            <div className="space-y-2">
              {data.users.map((account) => {
                const approved = account.approvalStatus === "APPROVED";
                return (
                  <div key={account.id} className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-[#0A2C57]">{account.fullName}</p>
                      <p className="text-xs text-slate-400">
                        {getRoleLabel(account.role)} · {formatCompactDate(account.createdAt)}
                      </p>
                    </div>
                    <span className={`text-[11px] font-black ${approved ? "text-[#2BAF3A]" : "text-amber-600"}`}>
                      {getApprovalLabel(account.approvalStatus)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
