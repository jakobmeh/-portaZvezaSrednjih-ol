import Link from "next/link";
import { Trophy, Users, Plus, ArrowRight, Zap, Star, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { formatCompactDate, getTournamentStatus, isProUser } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const { notifications, upcoming, teams, stats, myOrganized } =
    await getDashboardData(user);
  const pro = isProUser(user);
  const unread = notifications.filter((n) => !n.isRead).length;
  // Prikaži pozdrav prve 3 minute po registraciji
  const isWelcome = (Date.now() - new Date(user.createdAt).getTime()) < 3 * 60 * 1000;

  return (
    <AppShell
      user={user}
      activePath="/dashboard"
      title={`Zdravo, ${user.fullName.split(" ")[0]}`}
      actions={
        pro ? (
          <Link href="/tournaments/create" className="btn-primary py-2 px-5 text-sm">
            <Plus size={14} /> Nov turnir
          </Link>
        ) : undefined
      }
    >

      {/* ── Welcome banner ── */}
      {isWelcome && (
        <div
          className="mb-6 flex items-center gap-4 rounded-2xl px-6 py-4"
          style={{ background: "linear-gradient(135deg, rgba(43,175,58,0.15) 0%, rgba(43,175,58,0.05) 100%)", border: "1px solid rgba(43,175,58,0.3)" }}
        >
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="font-black" style={{ fontFamily: "var(--font-heading)" }}>
              Dobrodošel, {user.fullName.split(" ")[0]}!
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {pro
                ? "Imaš Pro dostop – začni z ustvarjanjem turnirjev."
                : "Račun je ustvarjen. Pridruži se turnirju ali ustvari ekipo."}
            </p>
          </div>
          {pro && <span className="badge badge-pro shrink-0">⭐ Pro aktiven</span>}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 mb-10 lg:grid-cols-4">
        {[
          { label: "Turnirji skupaj", value: stats.tournaments, sub: "v sistemu" },
          { label: "Moje prijave", value: stats.joined, sub: "ekip na turnirjih" },
          { label: "Moje ekipe", value: stats.teams, sub: "aktivnih" },
          { label: "Neprebrana", value: unread, sub: "obvestila", href: "/notifications" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-medium mb-4" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-5xl font-black" style={{ fontFamily: "var(--font-heading)", color: s.value > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
              {s.value}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two column ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

        {/* ── Left ── */}
        <div className="space-y-8">

          {/* Prihajajoči turnirji */}
          <section>
            <SectionHeader title="Prihajajoči turnirji" href="/tournaments" linkLabel="Vsi turnirji" />
            {upcoming.length === 0 ? (
              <Empty text="Ni turnirjev." />
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {upcoming.map((t, i) => {
                  const status = getTournamentStatus({
                    date: t.date, maxTeams: t.maxTeams, registeredTeams: t.registrations.length,
                  });
                  return (
                    <Link
                      key={t.id}
                      href={`/tournaments/${t.slug}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors"
                      style={{
                        background: "var(--bg-surface)",
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{t.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {t.sport} · {t.location} · {formatCompactDate(t.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {t.registrations.length}/{t.maxTeams}
                        </span>
                        <StatusPill status={status} />
                        <ArrowRight size={13} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Moji organizirani turnirji */}
          {pro && myOrganized.length > 0 && (
            <section>
              <SectionHeader
                title="Moji turnirji"
                href="/tournaments"
                linkLabel="Upravljaj"
                icon={<Star size={12} style={{ color: "#f59e0b" }} />}
              />
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(245,158,11,0.2)" }}
              >
                {myOrganized.map((t, i) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {t.registrations.length} / {t.maxTeams} ekip
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-20 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-card)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((t.registrations.length / t.maxTeams) * 100, 100)}%`,
                            background: "#2baf3a",
                          }}
                        />
                      </div>
                      <ArrowRight size={13} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Pro CTA */}
          {!pro && (
            <div
              className="flex items-center justify-between rounded-2xl px-6 py-5"
              style={{ background: "rgba(43,175,58,0.06)", border: "1px solid rgba(43,175,58,0.2)" }}
            >
              <div>
                <p className="font-bold text-sm">Organiziraj lastne turnirje</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Nadgradi na Pro za 5€ in postani organizator.
                </p>
              </div>
              <Link href="/upgrade" className="btn-primary shrink-0 py-2 px-5 text-sm">
                <Zap size={13} /> Pro
              </Link>
            </div>
          )}
        </div>

        {/* ── Right ── */}
        <div className="space-y-8">

          {/* Moje ekipe */}
          <section>
            <SectionHeader title="Moje ekipe" href="/teams" linkLabel="Upravljaj" />
            {teams.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <Users size={22} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Še nimaš ekipe.</p>
                <Link href="/teams" className="btn-primary py-2 px-4 text-xs inline-flex">
                  <Plus size={12} /> Ustvari ekipo
                </Link>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {teams.map((team, i) => (
                  <Link
                    key={team.id}
                    href="/teams"
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
                      style={{ background: "rgba(43,175,58,0.08)" }}
                    >
                      {sportEmoji(team.sport)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{team.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {team.sport} · {team.players.length} članov
                      </p>
                    </div>
                    <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
                      {team.registrations.length} prijav
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Obvestila */}
          <section>
            <SectionHeader title="Obvestila" href="/notifications" linkLabel="Vsa" />
            {notifications.length === 0 ? (
              <Empty text="Ni obvestil." />
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {notifications.slice(0, 5).map((n, i) => (
                  <Link
                    key={n.id}
                    href="/notifications"
                    className="flex items-start gap-3 px-5 py-3.5 transition-colors group"
                    style={{
                      background: "var(--bg-surface)",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div className="mt-1 shrink-0">
                      {n.isRead
                        ? <CheckCircle size={13} style={{ color: "var(--text-muted)" }} />
                        : <span className="block h-2 w-2 rounded-full mt-0.5" style={{ background: "#2baf3a" }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)" }}>
                        {n.title}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                        {n.content}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </AppShell>
  );
}

/* ── Helpers ── */

function SectionHeader({
  title, href, linkLabel, icon,
}: {
  title: string;
  href: string;
  linkLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {icon}{title}
      </h2>
      <Link href={href} className="text-xs font-semibold transition-colors" style={{ color: "#2baf3a" }}>
        {linkLabel} →
      </Link>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    "Odprt":     { bg: "rgba(43,175,58,0.1)",  text: "#6ee77a" },
    "Poln":      { bg: "rgba(239,68,68,0.1)",  text: "#f87171" },
    "Zaključen": { bg: "rgba(255,255,255,0.06)", text: "var(--text-muted)" },
  };
  const c = colors[status] ?? colors["Zaključen"];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl py-10 text-center text-sm"
      style={{ background: "var(--bg-surface)", border: "1px dashed var(--border-strong)", color: "var(--text-muted)" }}
    >
      {text}
    </div>
  );
}

function sportEmoji(sport: string) {
  const map: Record<string, string> = {
    "Futsal": "⚽", "Nogomet": "⚽", "Košarka": "🏀", "Odbojka": "🏐",
    "Rokomet": "🤾", "Atletika": "🏃", "Namizni tenis": "🏓",
    "Badminton": "🏸", "Šah": "♟️",
  };
  return map[sport] ?? "🏆";
}
