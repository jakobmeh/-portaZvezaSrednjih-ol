import Link from "next/link";
import { Shield, Trophy, Users, UserX, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { rejectUserAction, approveUserAction, activateSchoolLicenseAction, grantProAction, revokeProAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminData, getAdminLicenses } from "@/lib/data";
import { formatCompactDate, getApprovalLabel, getTournamentStatus, isProUser } from "@/lib/utils";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { SchoolSelect } from "@/components/school-select";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [data, licenses] = await Promise.all([getAdminData(), getAdminLicenses()]);

  // Group users by school
  const bySchool = new Map<string, typeof data.users>();
  for (const u of data.users) {
    if (!bySchool.has(u.schoolName)) bySchool.set(u.schoolName, []);
    bySchool.get(u.schoolName)!.push(u);
  }

  return (
    <AppShell user={user} activePath="/admin" title="Admin panel" description="Upravljanje uporabnikov in šolskih licenc.">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* Leva stran - Uporabniki */}
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vsi uporabniki", value: data.users.length, icon: Users, color: "#2baf3a" },
              { label: "Turnirji", value: data.tournaments.length, icon: Trophy, color: "#f59e0b" },
              { label: "Aktivne licence", value: licenses.length, icon: Shield, color: "#06b6d4" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p className="text-3xl font-black" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Uporabniki po šolah */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Uporabniki ({data.users.length})
            </h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
              {data.users.map((acc, i) => {
                const pro = acc.isPro && (!acc.proUntil || acc.proUntil > new Date());
                const blocked = acc.approvalStatus === "REJECTED";
                return (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                    style={{
                      background: blocked ? "rgba(239,68,68,0.05)" : "var(--bg-surface)",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      opacity: blocked ? 0.7 : 1,
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style={{ background: "rgba(43,175,58,0.15)", color: "#6ee77a" }}>
                      {acc.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{acc.fullName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{acc.email} · {acc.schoolName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pro && (
                        <span className="badge badge-pro"><Star size={9} />Pro</span>
                      )}
                      {acc.role === "ADMIN" && (
                        <span className="badge badge-red">Admin</span>
                      )}
                      {blocked && (
                        <span className="badge badge-red">Blokiran</span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatCompactDate(acc.createdAt)}
                      </span>
                      {acc.role !== "ADMIN" && (
                        <div className="flex items-center gap-1.5">
                          {/* Pro gumb */}
                          {pro ? (
                            <form action={revokeProAction}>
                              <input type="hidden" name="userId" value={acc.id} />
                              <button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "none", cursor: "pointer" }}>
                                - Pro
                              </button>
                            </form>
                          ) : (
                            <form action={grantProAction}>
                              <input type="hidden" name="userId" value={acc.id} />
                              <button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(43,175,58,0.1)", color: "#6ee77a", border: "none", cursor: "pointer" }}>
                                + Pro
                              </button>
                            </form>
                          )}
                          {/* Blokiraj */}
                          {blocked ? (
                            <form action={approveUserAction}>
                              <input type="hidden" name="userId" value={acc.id} />
                              <button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "none", cursor: "pointer" }}>
                                Odblokiraj
                              </button>
                            </form>
                          ) : (
                            <form action={rejectUserAction}>
                              <input type="hidden" name="userId" value={acc.id} />
                              <button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "none", cursor: "pointer" }}>
                                <UserX size={11} className="inline" />
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Turnirji */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Turnirji ({data.tournaments.length})
            </h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
              {data.tournaments.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>Ni turnirjev.</div>
              ) : data.tournaments.map((t, i) => {
                const status = getTournamentStatus({ date: t.date, maxTeams: t.maxTeams, registeredTeams: t.registrations.length });
                return (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{ background: "var(--bg-surface)", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.sport} · {t.organizer.fullName}</p>
                    </div>
                    <span className={`badge ${status === "Odprt" ? "badge-green" : status === "Poln" ? "badge-red" : "badge-gray"}`}>{status}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.registrations.length}/{t.maxTeams}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Desna stran - Licence */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            <Shield size={11} className="inline mr-1.5" style={{ color: "#f59e0b" }} />
            Šolske licence
          </h2>

          {/* Aktiviraj */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <p className="text-sm font-bold mb-1">Aktiviraj šolski paket</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Generira unikatno kodo, ki jo šola pošlje dijakom. Dijak jo vnese pri registraciji → dobi Pro.
            </p>
            <form action={activateSchoolLicenseAction} className="space-y-3">
              <div>
                <label className="label-text">Šola</label>
                <SchoolSelect schools={SCHOOL_OPTIONS} />
              </div>
              <div>
                <label className="label-text">Plan</label>
                <select name="plan" className="field" defaultValue="STANDARD">
                  <option value="STANDARD">Standard – do 50 dijakov (49€/leto)</option>
                  <option value="UNLIMITED">Unlimited – neomejeno (99€/leto)</option>
                </select>
              </div>
              <button className="btn-primary w-full py-2.5 text-sm" style={{ background: "#f59e0b" }}>
                Aktiviraj &amp; generiraj kodo
              </button>
            </form>
          </div>

          {/* Aktivne licence */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Aktivne licence ({licenses.length})
            </p>
            {licenses.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ni aktivnih licenc.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                {licenses.map((lic: any, i: number) => {
                  const expired = lic.expiresAt && new Date(lic.expiresAt) < new Date();
                  return (
                    <div
                      key={lic.id}
                      className="px-5 py-4"
                      style={{
                        background: "var(--bg-surface)",
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                        opacity: expired ? 0.5 : 1,
                      }}
                    >
                      <p className="font-semibold text-sm">{lic.schoolName}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="badge badge-pro">{lic.plan}</span>
                        {lic.expiresAt && (
                          <span className="text-xs" style={{ color: expired ? "#f87171" : "var(--text-muted)" }}>
                            {expired ? "Potekla" : "do"} {new Date(lic.expiresAt).toLocaleDateString("sl-SI")}
                          </span>
                        )}
                      </div>
                      {lic.inviteToken && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(43,175,58,0.08)", border: "1px solid rgba(43,175,58,0.2)" }}>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Koda:</span>
                          <span className="font-black text-sm tracking-widest" style={{ color: "#6ee77a", fontFamily: "monospace" }}>
                            {lic.inviteToken}
                          </span>
                          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>→ pošlji dijakom</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pojasnilo */}
          <div className="mt-5 rounded-2xl p-4" style={{ background: "rgba(43,175,58,0.05)", border: "1px solid rgba(43,175,58,0.15)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#6ee77a" }}>Kako deluje koda?</p>
            <ul className="space-y-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <li>1. Aktiviraš licenco → sistem generira 8-znakovno kodo</li>
              <li>2. Kodo pošlješ šoli (npr. <span style={{color:"var(--text-secondary)"}}>XKQM7R2P</span>)</li>
              <li>3. Dijak pri registraciji vnese kodo + izbere pravo šolo</li>
              <li>4. Napačna šola ali napačna koda → napaka, brez Pro</li>
              <li>5. Brez kode → brezplačen račun (admin lahko + Pro ročno)</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
