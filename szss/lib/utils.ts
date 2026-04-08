import { ApprovalStatus, TournamentRegistrationStatus, UserRole } from "@prisma/client";

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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
