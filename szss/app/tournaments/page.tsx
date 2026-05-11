import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, MapPin, Plus, Search, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FilterSelect } from "@/components/filter-select";
import { requireUser } from "@/lib/auth";
import { getTournamentList } from "@/lib/data";
import { SPORTS, formatCompactDate, getTournamentStatus, isProUser } from "@/lib/utils";

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; status?: string }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const { tournaments } = await getTournamentList(filters);
  const pro = isProUser(user);

  const sportOptions = SPORTS.map((s) => ({ label: s, value: s }));
  const statusOptions = [
    { label: "Odprt", value: "Odprt" },
    { label: "Poln", value: "Poln" },
    { label: "Zaključen", value: "Zaključen" },
  ];

  const hasFilters = !!(filters.q || filters.sport || filters.status);

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Turnirji"
      description="Vsi šolski športni turnirji."
      actions={
        pro ? (
          <Link href="/tournaments/create" className="btn-primary py-2 px-4 text-sm">
            <Plus size={14} /> Nov turnir
          </Link>
        ) : null
      }
    >
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Search - GET form submit */}
        <form method="GET" className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              name="q"
              defaultValue={filters.q}
              placeholder="Išči turnirje..."
              className="field py-2"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>
          {/* Keep other filters in form */}
          {filters.sport && <input type="hidden" name="sport" value={filters.sport} />}
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Išči</button>
        </form>

        {/* Custom dropdowns - navigate on change */}
        <Suspense>
          <FilterSelect
            name="sport"
            value={filters.sport}
            placeholder="Vsi športi"
            options={sportOptions}
          />
          <FilterSelect
            name="status"
            value={filters.status}
            placeholder="Vsi statusi"
            options={statusOptions}
          />
        </Suspense>

        {hasFilters && (
          <Link href="/tournaments" className="btn-ghost py-2 px-4 text-sm">
            Počisti ✕
          </Link>
        )}
      </div>

      {/* Results */}
      {tournaments.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: "var(--bg-surface)", border: "1px dashed var(--border-strong)" }}>
          <Trophy size={28} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>
            {hasFilters ? "Ni rezultatov za te filtre." : "Ni turnirjev."}
          </p>
          {pro && !hasFilters && (
            <Link href="/tournaments/create" className="btn-primary mt-4 inline-flex py-2 px-5 text-sm">
              <Plus size={14} /> Ustvari turnir
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((t) => {
            const status = t.status;
            const pct = Math.round((t.registrations.length / t.maxTeams) * 100);
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="group flex flex-col rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <span className="badge badge-blue">{t.sport}</span>
                  <span className={`badge ${status === "Odprt" ? "badge-green" : status === "Poln" ? "badge-red" : "badge-gray"}`}>
                    {status}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="font-black text-base leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
                  {t.title}
                </h3>
                <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {t.description}
                </p>

                {/* Meta */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={10} /> {t.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <CalendarDays size={10} /> {formatCompactDate(t.date)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Users size={10} /> {t.registrations.length}/{t.maxTeams} ekip
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--bg-card)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#2baf3a",
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.organizer.fullName}</span>
                  <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#6ee77a" }}>
                    Odpri →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
