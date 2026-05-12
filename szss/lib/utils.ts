import { ApprovalStatus, MatchStatus, TournamentFormat, TournamentRegistrationStatus, UserRole } from "@prisma/client";

export const SPORTS = [
  "Futsal",
  "Nogomet",
  "Košarka",
  "Odbojka",
  "Rokomet",
  "Atletika",
  "Namizni tenis",
  "Badminton",
  "Šah",
] as const;

export const TOURNAMENT_FORMATS: { value: TournamentFormat; label: string; description: string }[] = [
  {
    value: "KNOCKOUT",
    label: "Izločilni boji",
    description: "Poraženec izpade, zmagovalec gre naprej.",
  },
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCompactDate(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    default:
      return "Udeleženec";
  }
}

export function getApprovalLabel(status: ApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "Odobren";
    case "REJECTED":
      return "Zavrnjen";
    default:
      return "V čakanju";
  }
}

export function getRegistrationLabel(status: TournamentRegistrationStatus) {
  return status === "CONFIRMED" ? "Potrjena" : "Čakalna vrsta";
}

export function getTournamentStatus({
  date,
  maxTeams,
  registeredTeams,
}: {
  date: Date;
  maxTeams: number;
  registeredTeams: number;
}) {
  if (date.getTime() < Date.now()) {
    return "Zaključen";
  }

  if (registeredTeams >= maxTeams) {
    return "Poln";
  }

  return "Odprt";
}

export function getTournamentStatusTone(status: string) {
  switch (status) {
    case "Poln":
      return "bg-amber-100 text-amber-800";
    case "Zaključen":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function getMatchStatusLabel(status: MatchStatus) {
  switch (status) {
    case "LIVE":
      return "V živo";
    case "FINISHED":
      return "Končano";
    case "CANCELLED":
      return "Odpovedano";
    default:
      return "Prihajajoče";
  }
}

export function getMatchStatusTone(status: MatchStatus) {
  switch (status) {
    case "LIVE":
      return "bg-red-100 text-red-700 animate-pulse";
    case "FINISHED":
      return "bg-slate-100 text-slate-600";
    case "CANCELLED":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export function getTournamentFormatLabel(format: TournamentFormat) {
  switch (format) {
    case "KNOCKOUT":
      return "Izločilni boji";
    case "COMBINED":
      return "Kombinirani";
    default:
      return "Skupinski del";
  }
}

export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type FinishedMatch = {
  homeTeamId: string;
  homeTeam: { name: string };
  awayTeamId: string;
  awayTeam: { name: string };
  scoreHome: number | null;
  scoreAway: number | null;
  status: MatchStatus;
  round?: number | null;
  group?: string | null;
};

export function calculateStandings(
  matches: FinishedMatch[],
  group?: string,
): StandingRow[] {
  return calculateStandingsWithPoints(matches, group, () => 3);
}

function calculateStandingsWithPoints(
  matches: FinishedMatch[],
  group: string | undefined,
  winnerPoints: (match: FinishedMatch) => number,
): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  function ensure(teamId: string, teamName: string) {
    if (!rows.has(teamId)) {
      rows.set(teamId, {
        teamId,
        teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    }
    return rows.get(teamId)!;
  }

  for (const match of matches) {
    if (match.status !== "FINISHED") continue;
    if (match.scoreHome == null || match.scoreAway == null) continue;
    if (group !== undefined && match.group !== group) continue;

    const home = ensure(match.homeTeamId, match.homeTeam.name);
    const away = ensure(match.awayTeamId, match.awayTeam.name);

    home.played++;
    away.played++;
    home.goalsFor += match.scoreHome;
    home.goalsAgainst += match.scoreAway;
    away.goalsFor += match.scoreAway;
    away.goalsAgainst += match.scoreHome;

    if (match.scoreHome > match.scoreAway) {
      home.wins++;
      home.points += winnerPoints(match);
      away.losses++;
    } else if (match.scoreHome < match.scoreAway) {
      away.wins++;
      away.points += winnerPoints(match);
      home.losses++;
    } else {
      home.draws++;
      home.points += 1;
      away.draws++;
      away.points += 1;
    }

    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

export function calculateKnockoutStandings(matches: FinishedMatch[]): StandingRow[] {
  const rows = calculateStandingsWithPoints(matches, undefined, () => 0);
  const byTeamId = new Map(rows.map((row) => [row.teamId, row]));

  function outcome(match: FinishedMatch) {
    if (match.status !== "FINISHED" || match.scoreHome == null || match.scoreAway == null || match.scoreHome === match.scoreAway) {
      return null;
    }

    return match.scoreHome > match.scoreAway
      ? { winnerId: match.homeTeamId, loserId: match.awayTeamId }
      : { winnerId: match.awayTeamId, loserId: match.homeTeamId };
  }

  const finished = matches
    .filter((match) => match.status === "FINISHED" && match.scoreHome != null && match.scoreAway != null)
    .sort((a, b) => (b.round ?? 0) - (a.round ?? 0));

  const finalMatch = finished.find((match) => match.group === "Finale")
    ?? finished.find((match) => match.group !== "Tekma za 3. mesto");
  const thirdPlaceMatch = finished.find((match) => match.group === "Tekma za 3. mesto");

  const finalOutcome = finalMatch ? outcome(finalMatch) : null;
  if (finalOutcome) {
    const winner = byTeamId.get(finalOutcome.winnerId);
    const runnerUp = byTeamId.get(finalOutcome.loserId);
    if (winner) winner.points = 3;
    if (runnerUp) runnerUp.points = 2;
  }

  const thirdPlaceOutcome = thirdPlaceMatch ? outcome(thirdPlaceMatch) : null;
  if (thirdPlaceOutcome) {
    const thirdPlace = byTeamId.get(thirdPlaceOutcome.winnerId);
    if (thirdPlace) thirdPlace.points = 1;
  }

  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

export function isProUser(user: { role: UserRole; isPro: boolean; proUntil: Date | null }) {
  if (user.role === "ADMIN") return true;
  if (!user.isPro) return false;
  if (user.proUntil && user.proUntil < new Date()) return false;
  return true;
}
