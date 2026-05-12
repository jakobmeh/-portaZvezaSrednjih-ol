import Link from "next/link";
import { ArrowLeft, Star, UserX, Users, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminSchoolDetail, getAdminLicenses } from "@/lib/data";
import { grantProAction, revokeProAction, approveUserAction, rejectUserAction } from "@/lib/actions";
import { formatCompactDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function AdminSchoolPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const user = await requireAdmin();
  const { school } = await params;
  const schoolName = decodeURIComponent(school);

  const [users, licenses] = await Promise.all([
    getAdminSchoolDetail(schoolName),
    getAdminLicenses(),
  ]);

  if (users.length === 0) notFound();

  const license = licenses.find((l: any) => l.schoolName === schoolName);
  const proUsers = users.filter((u) => u.isPro && (!u.proUntil || u.proUntil > new Date()));
  const pendingUsers = users.filter((u) => u.approvalStatus === "PENDING");
  const blockedUsers = users.filter((u) => u.approvalStatus === "REJECTED");

  return (
    <AppShell user={user} activePath="/admin" title={schoolName}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Nazaj */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Nazaj na admin
        </Link>

        {/* Header */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <h1 className="text-2xl font-black mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {schoolName}
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Skupaj", value: users.length, color: "var(--text-primary)" },
              { label: "Pro", value: proUsers.length, color: "#fbbf24" },
              { label: "Čakajo", value: pendingUsers.length, color: "#f87171" },
              { label: "Blokirani", value: blockedUsers.length, color: "#6b7280" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-2xl font-black" style={{ color: s.color, fontFamily: "var(--font-heading)" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Licenca */}
          {license && (
            <div className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: "#fbbf24" }} />
                <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Šolska licenca</span>
                {license.inviteToken && (
                  <span className="font-black text-sm tracking-widest" style={{ color: "#6ee77a", fontFamily: "monospace" }}>
                    {license.inviteToken}
                  </span>
                )}
              </div>
              {license.expiresAt && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  do {new Date(license.expiresAt).toLocaleDateString("sl-SI")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Seznam uporabnikov */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            <Users size={11} className="inline mr-1.5" />
            Uporabniki ({users.length})
          </h2>
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
            {users.map((acc, i) => {
              const pro = acc.isPro && (!acc.proUntil || acc.proUntil > new Date());
              const blocked = acc.approvalStatus === "REJECTED";
              const pending = acc.approvalStatus === "PENDING";
              return (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{
                    background: blocked ? "rgba(239,68,68,0.05)" : pending ? "rgba(245,158,11,0.04)" : "var(--bg-surface)",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    opacity: blocked ? 0.7 : 1,
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style={{ background: "rgba(43,175,58,0.15)", color: "#6ee77a" }}>
                    {acc.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{acc.fullName}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{acc.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pro && <span className="badge badge-pro"><Star size={9} />Pro</span>}
                    {acc.role === "ADMIN" && <span className="badge badge-red">Admin</span>}
                    {blocked && <span className="badge badge-red">Blokiran</span>}
                    {pending && <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>Čaka</span>}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatCompactDate(acc.createdAt)}
                    </span>
                    {acc.role !== "ADMIN" && (
                      <div className="flex items-center gap-1.5">
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
      </div>
    </AppShell>
  );
}
