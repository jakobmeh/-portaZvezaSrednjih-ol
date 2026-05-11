import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin, Plus, Trophy, CheckCircle, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BracketView } from "@/components/bracket-view";
import { FormSelect } from "@/components/form-select";
import { LiveScoreInput } from "@/components/live-score-input";
import { TournamentChatPopup } from "@/components/tournament-chat-popup";
import { createMatchAction, deleteMatchAction, setMatchStatusAction, updateMatchResultAction, completeTournamentAction, generateMatchesAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getTournamentDetails } from "@/lib/data";
import { formatDate, getMatchStatusLabel } from "@/lib/utils";
import { MatchStatus } from "@prisma/client";

export default async function MatchesPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const tournament = await getTournamentDetails(slug);
  if (!tournament) notFound();
  if (tournament.organizerId !== user.id) redirect(`/tournaments/${slug}`);

  const confirmedTeams = tournament.registrations.filter((r) => r.status === "CONFIRMED").map((r) => r.team);
  const upcoming = tournament.matches.filter((m) => m.status === "UPCOMING");
  const live = tournament.matches.filter((m) => m.status === "LIVE");
  const finished = tournament.matches.filter((m) => m.status === "FINISHED");
  const allDone = tournament.matches.length > 0 && upcoming.length === 0 && live.length === 0;
  const isCompleted = (tournament as any).isCompleted;
  const hasBracket = tournament.matches.some((m) => m.round !== null);
  const chatMessages = tournament.messages.map((message) => ({
    id: message.id,
    senderName: message.senderName,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Urnik tekem"
      description={tournament.title}
      actions={
        <div className="flex items-center gap-2">
          <TournamentChatPopup
            tournamentId={tournament.id}
            redirectTo={`/tournaments/${slug}/matches`}
            messages={chatMessages}
          />
          {isCompleted ? (
            <span className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "rgba(43,175,58,0.1)", color: "#6ee77a", border: "1px solid rgba(43,175,58,0.3)" }}>
              <Lock size={13} /> Zaključen
            </span>
          ) : allDone ? (
            <form action={completeTournamentAction}>
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button className="flex items-center gap-1.5 btn-primary py-2 px-4 text-sm">
                <CheckCircle size={13} /> Zaključi turnir
              </button>
            </form>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

        {/* Tekme */}
        <div className="space-y-5">
          {hasBracket && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  <Trophy size={12} className="inline mr-1 text-amber-400" />
                  Bracket
                </h2>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {tournament.matches.filter((m) => m.round !== null && m.status !== "CANCELLED").length} tekem
                </span>
              </div>
              <BracketView matches={tournament.matches} />
            </div>
          )}

          {live.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider" style={{ color: "#f87171" }}>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                V živo ({live.length})
              </h2>
              <div className="space-y-2">{live.map((m) => <MatchCard key={m.id} match={m} />)}</div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Prihajajoče ({upcoming.length})</h2>
              <div className="space-y-2">{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Končane ({finished.length})</h2>
              <div className="space-y-2">{finished.map((m) => <MatchCard key={m.id} match={m} />)}</div>
            </div>
          )}
          {tournament.matches.length === 0 && (
            <div className="rounded-xl py-16 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Trophy size={28} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Ni tekem.</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Ustvari prvo tekmo z obrazcem na desni.</p>
            </div>
          )}
        </div>

        {/* Dodaj tekmo */}
        <div className="space-y-4">

          {/* Auto-generiranje */}
          {confirmedTeams.length >= 2 && tournament.matches.length === 0 && (
            <div className="rounded-xl p-5" style={{ background: "rgba(43,175,58,0.08)", border: "1px solid rgba(43,175,58,0.35)" }}>
              <p className="text-sm font-black mb-1" style={{ color: "#6ee77a" }}>Generiraj razpored</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {tournament.format === "KNOCKOUT"
                  ? `${confirmedTeams.length} ekip → naključni pari za 1. krog`
                  : `${confirmedTeams.length} ekip → ${Math.ceil(confirmedTeams.length / 4)} skupina${Math.ceil(confirmedTeams.length / 4) === 1 ? "" : Math.ceil(confirmedTeams.length / 4) < 5 ? "e" : ""}, round-robin`}
              </p>
              <form action={generateMatchesAction}>
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <button className="btn-primary w-full py-2.5 text-sm">⚡ Generiraj tekme</button>
              </form>
            </div>
          )}

          {confirmedTeams.length >= 2 && tournament.matches.length > 0 && !tournament.matches.some(m => m.status === "LIVE" || m.status === "FINISHED") && (
            <form action={generateMatchesAction}>
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button className="w-full rounded-xl py-2 px-4 text-xs font-bold" style={{ background: "rgba(245,158,11,0.08)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>
                ↺ Regeneriraj (izbriše obstoječe)
              </button>
            </form>
          )}

          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Plus size={14} style={{ color: "#6ee77a" }} />
              <h2 className="font-black text-sm">Dodaj tekmo</h2>
            </div>
            {confirmedTeams.length < 2 ? (
              <p className="rounded-xl p-3 text-sm" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
                Za dodajanje tekme potrebuješ vsaj 2 potrjeni ekipi.
              </p>
            ) : (
              <form action={createMatchAction} className="space-y-3">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <div>
                  <label className="label-text">Domača ekipa</label>
                  <FormSelect
                    name="homeTeamId"
                    required
                    placeholder="Izberi ekipo..."
                    options={confirmedTeams.map((t) => ({ label: t.name, value: t.id }))}
                  />
                </div>
                <div>
                  <label className="label-text">Gostujoča ekipa</label>
                  <FormSelect
                    name="awayTeamId"
                    required
                    placeholder="Izberi ekipo..."
                    options={confirmedTeams.map((t) => ({ label: t.name, value: t.id }))}
                  />
                </div>
                <div>
                  <label className="label-text">Datum in ura</label>
                  <input type="datetime-local" name="scheduledAt" className="field" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-text">Igrišče</label>
                    <input name="court" className="field" placeholder="Igrišče 1" />
                  </div>
                  <div>
                    <label className="label-text">Krog</label>
                    <input name="round" type="number" min="1" className="field" placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className="label-text">Skupina</label>
                  <input name="group" className="field" placeholder="Skupina A" />
                </div>
                <button className="btn-primary w-full py-2.5">Dodaj tekmo</button>
              </form>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(43,175,58,0.06)", border: "1px solid rgba(43,175,58,0.2)" }}>
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Postopek</p>
            {["Dodaj tekme z ekipami in terminom", "Ko se tekma začne → označi kot V živo", "Po koncu vnesi rezultat in shrani", "Ko so vse tekme zaključene → klikni Zaključi turnir"].map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black" style={{ background: "rgba(43,175,58,0.25)", color: "#6ee77a" }}>{i + 1}</span>
                {s}
              </div>
            ))}
          </div>

          {!isCompleted && (
            <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-black mb-1" style={{ color: "#fbbf24" }}>⚠️ Lestvica še ne šteje</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Rezultati se prikažejo na globalni lestvici šele ko klikneš <strong style={{color:"var(--text-secondary)"}}>Zaključi turnir</strong>. To preprečuje zlorabo lestvice.
              </p>
            </div>
          )}

          {isCompleted && (
            <div className="rounded-xl p-4" style={{ background: "rgba(43,175,58,0.06)", border: "1px solid rgba(43,175,58,0.25)" }}>
              <p className="text-xs font-black mb-1" style={{ color: "#6ee77a" }}>✓ Rezultati so uradno potrjeni</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Turnir je zaključen. Rezultati se štejejo na globalni lestvici.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function MatchCard({ match }: {
  match: {
    id: string;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
    scoreHome: number | null;
    scoreAway: number | null;
    scheduledAt: Date | null;
    location: string | null;
    court: string | null;
    status: MatchStatus;
    round: number | null;
    group: string | null;
  };
}) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: `1px solid ${isLive ? "rgba(239,68,68,0.3)" : "var(--border)"}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {match.round && <span>Krog {match.round}</span>}
          {match.group && <span>· {match.group}</span>}
          {match.scheduledAt && <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(match.scheduledAt)}</span>}
          {(match.court || match.location) && <span className="flex items-center gap-1"><MapPin size={10} />{match.court ?? match.location}</span>}
        </div>
        <span className={`badge ${isLive ? "badge-live" : isFinished ? "badge-gray" : "badge-blue"}`}>
          {getMatchStatusLabel(match.status)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <p className="flex-1 text-right text-sm font-bold">{match.homeTeam.name}</p>
        <div className="flex items-center gap-1">
          {isFinished || isLive ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black" style={{ background: isLive ? "#ef4444" : "var(--bg-surface)", color: isLive ? "white" : "var(--text-primary)" }}>{match.scoreHome ?? "–"}</span>
              <span className="text-xs font-black px-0.5" style={{ color: "var(--text-muted)" }}>:</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black" style={{ background: isLive ? "#ef4444" : "var(--bg-surface)", color: isLive ? "white" : "var(--text-primary)" }}>{match.scoreAway ?? "–"}</span>
            </>
          ) : (
            <span className="px-3 text-sm font-bold" style={{ color: "var(--text-muted)" }}>vs</span>
          )}
        </div>
        <p className="flex-1 text-sm font-bold">{match.awayTeam.name}</p>
      </div>

      {/* Organizer controls */}
      <div className="mt-4 space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>

        {/* LIVE → real-time +/- gumbi */}
        {isLive && (
          <LiveScoreInput
            matchId={match.id}
            initialHome={match.scoreHome ?? 0}
            initialAway={match.scoreAway ?? 0}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
          />
        )}

        {/* Končana / prihajajoča → ročni vnos */}
        {!isLive && match.status !== "CANCELLED" && (
          <form action={updateMatchResultAction} className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
            <input type="hidden" name="matchId" value={match.id} />
            <div>
              <label className="label-text">{match.homeTeam.name}</label>
              <input name="scoreHome" type="number" min="0" defaultValue={match.scoreHome ?? ""} className="field text-center" placeholder="0" />
            </div>
            <span className="pb-2.5 text-sm font-black" style={{ color: "var(--text-muted)" }}>:</span>
            <div>
              <label className="label-text">{match.awayTeam.name}</label>
              <input name="scoreAway" type="number" min="0" defaultValue={match.scoreAway ?? ""} className="field text-center" placeholder="0" />
            </div>
            <input type="hidden" name="status" value="FINISHED" />
            <button className="btn-primary mb-0.5 py-2 px-3 text-xs">Shrani</button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {match.status === "UPCOMING" && (
            <form action={setMatchStatusAction}>
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="status" value="LIVE" />
              <button className="badge badge-live cursor-pointer py-1.5 px-3 text-xs font-bold">▶ Začni tekmo</button>
            </form>
          )}
          {match.status === "LIVE" && (
            <form action={setMatchStatusAction}>
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="status" value="FINISHED" />
              <button className="badge badge-gray cursor-pointer py-1.5 px-3 text-xs font-bold">⏹ Zaključi</button>
            </form>
          )}
          {match.status !== "CANCELLED" && match.status !== "FINISHED" && (
            <form action={setMatchStatusAction}>
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="status" value="CANCELLED" />
              <button className="badge badge-gray cursor-pointer py-1.5 px-3 text-xs font-bold">✕ Odpovej</button>
            </form>
          )}
          <form action={deleteMatchAction}>
            <input type="hidden" name="matchId" value={match.id} />
            <button className="badge badge-red cursor-pointer py-1.5 px-3 text-xs font-bold">Izbriši</button>
          </form>
        </div>
      </div>
    </div>
  );
}
