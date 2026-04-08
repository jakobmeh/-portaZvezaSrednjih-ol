import Image from "next/image";
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
      description="Pregled registracij, odobritev uporabnikov in objavljenih turnirjev v sistemu."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl tracking-tight text-[#0A2C57]">Registracije v čakanju</h2>
          <div className="mt-5 space-y-5">
            {data.pendingUsers.length > 0 ? (
              data.pendingUsers.map((pending) => (
                <div key={pending.id} className="rounded-[24px] border border-slate-200 p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-[#0A2C57]">{pending.fullName}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {pending.email} · {pending.schoolName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{getRoleLabel(pending.role)}</p>
                    </div>
                    {pending.schoolCardImage ? (
                      <Image
                        src={pending.schoolCardImage}
                        alt={`Šolska kartica ${pending.fullName}`}
                        width={224}
                        height={128}
                        className="h-32 w-56 rounded-2xl object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="mt-5 flex gap-3">
                    <form action={approveUserAction}>
                      <input type="hidden" name="userId" value={pending.id} />
                      <button className="rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white">
                        Odobri
                      </button>
                    </form>
                    <form action={rejectUserAction}>
                      <input type="hidden" name="userId" value={pending.id} />
                      <button className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600">
                        Zavrni
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-slate-50 p-5 text-sm text-slate-600">
                Trenutno ni registracij, ki bi čakale na admin pregled.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Objavljeni turnirji</h2>
            <div className="mt-5 space-y-4">
              {data.tournaments.map((tournament) => {
                const status = getTournamentStatus({
                  date: tournament.date,
                  maxTeams: tournament.maxTeams,
                  registeredTeams: tournament.registrations.length,
                });
                return (
                  <div key={tournament.id} className="rounded-[24px] bg-slate-50 p-4">
                    <p className="font-semibold text-[#0A2C57]">{tournament.title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {tournament.organizer.fullName} · {status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Zadnji uporabniki</h2>
            <div className="mt-5 space-y-4">
              {data.users.map((account) => (
                <div key={account.id} className="rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0A2C57]">{account.fullName}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {getApprovalLabel(account.approvalStatus)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {getRoleLabel(account.role)} · {formatCompactDate(account.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
