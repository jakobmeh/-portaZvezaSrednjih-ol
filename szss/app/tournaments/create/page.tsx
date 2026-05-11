import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SchoolSelect } from "@/components/school-select";
import { requireUser } from "@/lib/auth";
import { createTournamentAction } from "@/lib/actions";
import { SPORTS, TOURNAMENT_FORMATS, isProUser } from "@/lib/utils";

export default async function CreateTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  if (!isProUser(user)) redirect("/upgrade");

  const params = await searchParams;
  const error = params.error;

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Nov turnir"
      description="Organiziraj nov šolski športni turnir."
    >
      {error && (
        <div className="mb-5 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <form action={createTournamentAction} className="max-w-2xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label-text">Naziv turnirja</label>
            <input type="text" name="title" className="field" placeholder="npr. Medsolski pokal v futsalu" required />
          </div>
          <div>
            <label className="label-text">Šport</label>
            <SchoolSelect
              schools={SPORTS}
              name="sport"
              placeholder="Izberi šport..."
            />
          </div>
          <div>
            <label className="label-text">Lokacija</label>
            <input type="text" name="location" className="field" placeholder="npr. Športna dvorana Tivoli" required />
          </div>
          <div>
            <label className="label-text">Datum in čas</label>
            <input type="datetime-local" name="date" className="field" required />
          </div>
          <div>
            <label className="label-text">Maks. ekip</label>
            <input type="number" name="maxTeams" className="field" min="2" max="64" defaultValue="8" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Format</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {TOURNAMENT_FORMATS.map((f) => (
                <label
                  key={f.value}
                  className="flex flex-col gap-1 cursor-pointer rounded-xl p-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" name="format" value={f.value} defaultChecked={f.value === "GROUP_STAGE"} className="accent-indigo-500" />
                    <span className="font-bold text-sm">{f.label}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.description}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Opis</label>
            <textarea name="description" className="field" rows={3} placeholder="Kratek opis turnirja..." required />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="selfRegistrationEnabled" className="h-4 w-4 accent-indigo-500 rounded" />
              <div>
                <span className="text-sm font-bold">Omogoči samoregistracijo</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ekipe se prijavijo same z unikatno QR/URL povezavo</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary py-3 px-8">
            <Trophy size={14} />
            Ustvari turnir
          </button>
        </div>
      </form>
    </AppShell>
  );
}
