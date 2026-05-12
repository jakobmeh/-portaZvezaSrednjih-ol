import Link from "next/link";
import { Shield, Trophy, Users, UserX, Star, School, ChevronRight, Search, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { rejectUserAction, approveUserAction, activateSchoolLicenseAction, grantProAction, revokeProAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminData, getAdminLicenses, getAdminSchoolStats } from "@/lib/data";
import { formatCompactDate, getApprovalLabel, getTournamentStatus, isProUser } from "@/lib/utils";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { SchoolSelect } from "@/components/school-select";
import { CopyButton } from "@/components/copy-button";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const [data, licenses, schoolStats] = await Promise.all([
    getAdminData({ q: params.q, page: params.page ? Number(params.page) : 1 }),
    getAdminLicenses(),
    getAdminSchoolStats(),
  ]);

  return (
    <AppShell user={user} activePath="/admin" title="Admin panel" description="Upravljanje uporabnikov in šolskih licenc.">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* Leva stran - Uporabniki */}
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vsi uporabniki", value: data.totalUsers, icon: Users, color: "#2baf3a" },
              { label: "Turnirji", value: data.tournaments.length, icon: Trophy, color: "#f59e0b" },
              { label: "Aktivne licence", value: licenses.length, icon: Shield, color: "#06b6d4" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p className="text-3xl font-black" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Šole */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              <School size={11} className="inline mr-1.5" />
              Šole ({schoolStats.length})
            </h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
              {schoolStats.map((s, i) => (
                <Link
                  key={s.schoolName}
                  href={`/admin/schools/${encodeURIComponent(s.schoolName)}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/5"
                  style={{ background: "var(--bg-surface)", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style={{ background: "rgba(43,175,58,0.12)", color: "#6ee77a" }}>
                    <School size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.schoolName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {s.total} {s.total === 1 ? "uporabnik" : s.total < 5 ? "uporabniki" : "uporabnikov"}
                      {s.pro > 0 && <span style={{ color: "#fbbf24" }}> · {s.pro} Pro</span>}
                      {s.pending > 0 && <span style={{ color: "#f87171" }}> · {s.pending} čaka</span>}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
            </div>
          </section>

          {/* Zadnji uporabniki */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Uporabniki ({data.totalUsers})
              </h2>
            </div>

            {/* Search */}
            <form method="GET" className="mb-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="Išči po imenu, emailu ali šoli…"
                  className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
                />
              </div>
            </form>

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

            {/* Paginacija */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <Link
                  href={`/admin?q=${data.q}&page=${data.page - 1}`}
                  className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${data.page <= 1 ? "pointer-events-none opacity-30" : ""}`}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <ChevronLeft size={13} /> Prejšnja
                </Link>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {data.page} / {data.totalPages}
                </span>
                <Link
                  href={`/admin?q=${data.q}&page=${data.page + 1}`}
                  className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${data.page >= data.totalPages ? "pointer-events-none opacity-30" : ""}`}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  Naslednja <ChevronRight size={13} />
                </Link>
              </div>
            )}
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
              Generira unikatno kodo za šolo. Dijaki jo vnesejo pri registraciji in dobijo Pro dostop.
            </p>
            <form action={activateSchoolLicenseAction} className="space-y-3">
              <div>
                <label className="label-text">Šola</label>
                <SchoolSelect schools={SCHOOL_OPTIONS} />
              </div>

              {/* Cena */}
              <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Šolska licenca</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>neomejeno dijakov · 1 leto</p>
                </div>
                <p className="text-2xl font-black" style={{ color: "#fbbf24", fontFamily: "var(--font-heading)" }}>
                  500€<span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>/leto</span>
                </p>
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
              <div className="space-y-2">
                {licenses.map((lic: any) => {
                  const expired = lic.expiresAt && new Date(lic.expiresAt) < new Date();
                  return (
                    <div
                      key={lic.id}
                      className="rounded-2xl p-4"
                      style={{
                        background: "var(--bg-surface)",
                        border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                        opacity: expired ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-sm">{lic.schoolName}</p>
                          {lic.expiresAt && (
                            <p className="text-xs mt-0.5" style={{ color: expired ? "#f87171" : "var(--text-muted)" }}>
                              {expired ? "Potekla" : "Velja do"} {new Date(lic.expiresAt).toLocaleDateString("sl-SI")}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-black shrink-0" style={{ color: "#fbbf24", fontFamily: "var(--font-heading)" }}>
                          500€/leto
                        </p>
                      </div>
                      {lic.inviteToken && (
                        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(43,175,58,0.08)", border: "1px solid rgba(43,175,58,0.2)" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Koda:</span>
                            <span className="font-black text-sm tracking-widest truncate" style={{ color: "#6ee77a", fontFamily: "monospace" }}>
                              {lic.inviteToken}
                            </span>
                          </div>
                          <CopyButton code={lic.inviteToken} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pojasnilo */}
          <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(43,175,58,0.05)", border: "1px solid rgba(43,175,58,0.15)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#6ee77a" }}>Kako deluje koda?</p>
            <ol className="space-y-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <li>1. Aktiviraš licenco → sistem generira 8-znakovno kodo</li>
              <li>2. Kodo pošlješ šoli (npr. <span style={{ color: "var(--text-secondary)" }}>XKQM7R2P</span>)</li>
              <li>3. Dijak vnese kodo pri registraciji → dobi Pro</li>
              <li>4. Napačna koda ali šola → brez Pro</li>
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
