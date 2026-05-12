"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApprovalStatus, MatchStatus, TournamentFormat, UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { createSession, destroySession, requireAdmin, requireUser } from "./auth";
import { isProUser, slugify } from "./utils";
import { isSchoolOption } from "./schools";

const MAX_SCHOOL_CARD_SIZE = 4.5 * 1024 * 1024;
const ALLOWED_SCHOOL_CARD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithMessage(pathname: string, key: string, message: string): never {
  const [basePath, queryString] = pathname.split("?", 2);
  const params = new URLSearchParams(queryString ?? "");
  params.set(key, message);
  redirect(`${basePath}?${params.toString()}`);
}

function authTarget(_formData: FormData, modal: "login" | "register") {
  return `/${modal}`;
}

function getFinishedMatchOutcome(match: {
  homeTeamId: string;
  awayTeamId: string;
  scoreHome: number | null;
  scoreAway: number | null;
}) {
  if (match.scoreHome === null || match.scoreAway === null || match.scoreHome === match.scoreAway) return null;

  return match.scoreHome > match.scoreAway
    ? { winnerId: match.homeTeamId, loserId: match.awayTeamId }
    : { winnerId: match.awayTeamId, loserId: match.homeTeamId };
}

function hasSameTeams(
  match: { homeTeamId: string; awayTeamId: string },
  homeTeamId: string,
  awayTeamId: string,
) {
  return (
    (match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId) ||
    (match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId)
  );
}

async function syncFourTeamKnockoutNextMatches(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: { where: { status: "CONFIRMED" }, select: { teamId: true } },
      matches: {
        where: { status: { not: "CANCELLED" } },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tournament || tournament.format !== "KNOCKOUT" || tournament.registrations.length !== 4) return;

  const roundOne = tournament.matches.filter((m) => m.round === 1 && m.status === "FINISHED");
  if (roundOne.length !== 2) return;

  const outcomes = roundOne.map(getFinishedMatchOutcome);
  if (outcomes.some((outcome) => outcome === null)) return;

  const [first, second] = outcomes as [
    { winnerId: string; loserId: string },
    { winnerId: string; loserId: string },
  ];

  const nextMatches = tournament.matches.filter((m) => m.round === 2);

  async function ensureNextMatch(group: string, homeTeamId: string, awayTeamId: string) {
    const existing =
      nextMatches.find((m) => m.group === group) ??
      nextMatches.find((m) => hasSameTeams(m, homeTeamId, awayTeamId));

    if (!existing) {
      await prisma.match.create({
        data: {
          tournamentId,
          homeTeamId,
          awayTeamId,
          round: 2,
          group,
        },
      });
      return;
    }

    if (existing.status === "UPCOMING" && existing.scoreHome === null && existing.scoreAway === null) {
      await prisma.match.update({
        where: { id: existing.id },
        data: { homeTeamId, awayTeamId, group },
      });
    }
  }

  await ensureNextMatch("Finale", first.winnerId, second.winnerId);
  await ensureNextMatch("Tekma za 3. mesto", first.loserId, second.loserId);
}

async function saveSchoolCardLocally(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name) || ".jpg";
  const filename = `${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "cards");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);
  return `/uploads/cards/${filename}`;
}

async function saveSchoolCard(file: File) {
  const extension = path.extname(file.name) || ".jpg";
  const safeName = `${randomUUID()}${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`school-cards/${safeName}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  return saveSchoolCardLocally(file);
}

function validateSchoolCard(file: File, target: string) {
  if (file.size === 0) {
    redirectWithMessage(target, "registerError", "Naloži sliko šolske kartice.");
  }

  if (file.size > MAX_SCHOOL_CARD_SIZE) {
    redirectWithMessage(target, "registerError", "Slika kartice je prevelika. Največja dovoljena velikost je 4.5 MB.");
  }

  if (!ALLOWED_SCHOOL_CARD_TYPES.has(file.type)) {
    redirectWithMessage(target, "registerError", "Dovoljene so samo slike JPG, PNG ali WEBP.");
  }
}

export async function loginAction(formData: FormData) {
  const target = authTarget(formData, "login");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirectWithMessage(target, "loginError", "Ni uporabnika s tem e-poštnim naslovom.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    redirectWithMessage(target, "loginError", "Napačno geslo.");
  }

  if (user.approvalStatus === ApprovalStatus.REJECTED) {
    redirectWithMessage(
      target,
      "loginError",
      "Tvoj račun je bil onemogočen. Kontaktiraj administratorja.",
    );
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const target = authTarget(formData, "register");
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const schoolName = getString(formData, "schoolName");
  const inviteCode = getString(formData, "inviteCode").toUpperCase().trim();

  if (!fullName || !email || !password || !schoolName) {
    redirectWithMessage(target, "registerError", "Izpolni vsa obvezna polja.");
  }

  if (!isSchoolOption(schoolName)) {
    redirectWithMessage(target, "registerError", "Izberi veljavno šolo s seznama.");
  }

  if (password.length < 6) {
    redirectWithMessage(target, "registerError", "Geslo mora biti dolgo vsaj 6 znakov.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirectWithMessage(target, "registerError", "Ta e-poštni naslov je že zaseden.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Preveri invite kodo - koda mora biti veljavna IN se ujemati s šolo ki jo je izbral
  let isPro = false;
  let proUntil: Date | null = null;
  let inviteValid = false;

  if (inviteCode) {
    const license = await (prisma.schoolLicense as any).findUnique({
      where: { inviteToken: inviteCode },
    });

    if (!license) {
      redirectWithMessage(target, "registerError", "Napačna šolska koda.");
    }

    if (license.schoolName !== schoolName) {
      redirectWithMessage(
        target,
        "registerError",
        `Ta koda je za šolo "${license.schoolName}". Izberi pravilno šolo ali popravi kodo.`
      );
    }

    const expired = license.expiresAt && license.expiresAt < new Date();
    if (expired) {
      redirectWithMessage(target, "registerError", "Šolska koda je potekla. Kontaktiraj administratorja.");
    }

    isPro = true;
    proUntil = license.expiresAt;
    inviteValid = true;
  }

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      schoolName,
      role: UserRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.APPROVED,
      isPro,
      proUntil,
    },
  });

  // Obvesti admina
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });
  if (admins.length > 0) {
    const content = inviteValid
      ? `${fullName} (${schoolName}) se je registriral s šolsko kodo – dobil Pro.`
      : `${fullName} (${schoolName}) se je registriral brez kode – brezplačen račun.`;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: "Nov uporabnik",
        content,
      })),
    });
  }

  await createSession(newUser.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createTournamentAction(formData: FormData) {
  const user = await requireUser();
  if (!isProUser(user)) {
    redirect("/upgrade");
  }

  const title = getString(formData, "title");
  const sport = getString(formData, "sport");
  const location = getString(formData, "location");
  const description = getString(formData, "description");
  const maxTeams = Number(getString(formData, "maxTeams"));
  const date = new Date(getString(formData, "date"));
  const formatRaw = getString(formData, "format");
  const format = ["GROUP_STAGE", "KNOCKOUT", "COMBINED"].includes(formatRaw)
    ? (formatRaw as TournamentFormat)
    : "KNOCKOUT";
  const selfRegistrationEnabled = getString(formData, "selfRegistrationEnabled") === "on";

  if (!title || !sport || !location || !description || !maxTeams || Number.isNaN(date.getTime())) {
    redirectWithMessage("/tournaments/create", "error", "Preveri vsa polja turnirja.");
  }

  let slug = slugify(title);
  let suffix = 1;

  while (await prisma.tournament.findUnique({ where: { slug } })) {
    slug = `${slugify(title)}-${suffix}`;
    suffix += 1;
  }

  const selfRegistrationToken = selfRegistrationEnabled ? randomUUID() : null;

  await prisma.tournament.create({
    data: {
      title,
      slug,
      sport,
      location,
      description,
      maxTeams,
      date,
      format,
      selfRegistrationEnabled,
      selfRegistrationToken,
      organizerId: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tournaments");
  redirect(`/tournaments/${slug}`);
}

export async function createTeamAction(formData: FormData) {
  const user = await requireUser();
  const name = getString(formData, "name");
  const sport = getString(formData, "sport");

  if (!name || !sport) {
    redirectWithMessage("/teams", "error", "Vnesi ime ekipe in šport.");
  }

  const team = await prisma.team.create({
    data: {
      name,
      sport,
      schoolName: user.schoolName,
      createdById: user.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      fullName: user.fullName,
    },
  });

  revalidatePath("/teams");
  revalidatePath("/school");
  redirect("/teams");
}

export async function addSchoolmateToTeamAction(formData: FormData) {
  const user = await requireUser();
  const teamId = getString(formData, "teamId");
  const memberUserId = getString(formData, "memberUserId");
  const position = getString(formData, "position");

  const [team, schoolmate, existingMember] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.user.findUnique({ where: { id: memberUserId } }),
    prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberUserId,
      },
    }),
  ]);

  if (!team || team.createdById !== user.id) {
    redirectWithMessage("/teams", "error", "To ekipo lahko ureja samo njen ustvarjalec.");
  }

  if (!schoolmate || schoolmate.schoolName !== user.schoolName) {
    redirectWithMessage("/teams", "error", "Izbereš lahko samo uporabnike iz svoje šole.");
  }

  if (existingMember) {
    redirectWithMessage("/teams", "error", "Ta uporabnik je že v ekipi.");
  }

  await prisma.teamMember.create({
    data: {
      teamId,
      userId: schoolmate.id,
      fullName: schoolmate.fullName,
      position: position || null,
    },
  });

  revalidatePath("/teams");
  revalidatePath("/school");
  redirect("/teams");
}

export async function removePlayerAction(formData: FormData) {
  const user = await requireUser();
  const playerId = getString(formData, "playerId");

  const player = await prisma.teamMember.findUnique({
    where: { id: playerId },
    include: { team: true },
  });

  if (!player || player.team.createdById !== user.id) {
    redirect("/teams");
  }

  await prisma.teamMember.delete({
    where: { id: playerId },
  });

  revalidatePath("/teams");
  revalidatePath("/school");
  redirect("/teams");
}

export async function leaveTeamAction(formData: FormData) {
  const user = await requireUser();
  const teamId = getString(formData, "teamId");

  const [team, membership] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    }),
  ]);

  if (!team || !membership) {
    redirect("/teams");
  }

  if (team.createdById === user.id) {
    redirectWithMessage(
      "/teams",
      "error",
      "Ustvarjalec ekipe ne more zapustiti svoje ekipe brez prenosa lastništva.",
    );
  }

  await prisma.teamMember.delete({
    where: { id: membership.id },
  });

  revalidatePath("/teams");
  revalidatePath("/school");
  redirect("/teams");
}

export async function joinTournamentAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");
  const teamId = getString(formData, "teamId");

  const [team, tournament, currentCount] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.tournament.findUnique({ where: { id: tournamentId } }),
    prisma.tournamentRegistration.count({ where: { tournamentId } }),
  ]);

  if (!team || team.createdById !== user.id || !tournament) {
    redirect("/tournaments");
  }

  const existing = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_teamId: {
        tournamentId,
        teamId,
      },
    },
  });

  if (!existing) {
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamId,
        userId: user.id,
        status: currentCount >= tournament.maxTeams ? "WAITLISTED" : "CONFIRMED",
      },
    });

    await prisma.notification.create({
      data: {
        userId: tournament.organizerId,
        title: "Nova prijava na turnir",
        content: `Ekipa ${team.name} se je prijavila na turnir ${tournament.title}.`,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tournaments");
  revalidatePath("/school");
  revalidatePath(`/tournaments/${tournament.slug}`);
  redirect(`/tournaments/${tournament.slug}`);
}

export async function approveUserAction(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");

  await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: ApprovalStatus.APPROVED },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Račun odobren",
      content: "Admin je odobril tvojo registracijo. Zdaj se lahko prijaviš v sistem.",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/school");
  redirect("/admin");
}

export async function rejectUserAction(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");

  await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: ApprovalStatus.REJECTED },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Registracija zavrnjena",
      content: "Tvoja registracija je bila zavrnjena. Kontaktiraj administratorja za dodatna pojasnila.",
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function createMessageAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");
  const content = getString(formData, "content");
  const redirectTo = getString(formData, "redirectTo");

  if (!content) {
    redirect("/tournaments");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: { select: { userId: true } },
    },
  });

  if (!tournament) {
    redirect("/tournaments");
  }

  await prisma.message.create({
    data: {
      tournamentId,
      senderId: user.id,
      senderName: user.fullName,
      content,
    },
  });

  const notifyUserIds = new Set<string>([
    tournament.organizerId,
    ...tournament.registrations.map((registration) => registration.userId),
  ]);
  notifyUserIds.delete(user.id);

  if (notifyUserIds.size > 0) {
    await prisma.notification.createMany({
      data: [...notifyUserIds].map((userId) => ({
        userId,
        title: `Novo sporočilo: ${tournament.title}`,
        content: `${user.fullName}: ${content.slice(0, 120)}`,
      })),
    });
  }

  revalidatePath(`/tournaments/${tournament.slug}`);
  revalidatePath(`/tournaments/${tournament.slug}/matches`);

  const safeRedirect = redirectTo.startsWith(`/tournaments/${tournament.slug}`)
    ? redirectTo
    : `/tournaments/${tournament.slug}`;
  redirect(safeRedirect);
}

// ── Live score update (no redirect, za real-time) ─────────────

export async function liveScoreAction(formData: FormData) {
  const user = await requireUser();
  const matchId = getString(formData, "matchId");
  const scoreHome = Number(getString(formData, "scoreHome"));
  const scoreAway = Number(getString(formData, "scoreAway"));

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match || match.tournament.organizerId !== user.id) return;
  if (match.status !== "LIVE") return;

  await prisma.match.update({
    where: { id: matchId },
    data: { scoreHome, scoreAway },
  });

  revalidatePath(`/tournaments/${match.tournament.slug}/matches`);
}

// ── Match Management ────────────────────────────────────────

export async function createMatchAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");
  const homeTeamId = getString(formData, "homeTeamId");
  const awayTeamId = getString(formData, "awayTeamId");
  const scheduledAtRaw = getString(formData, "scheduledAt");
  const location = getString(formData, "location");
  const court = getString(formData, "court");
  const roundRaw = getString(formData, "round");
  const group = getString(formData, "group");

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== user.id) {
    redirectWithMessage(`/tournaments/${tournamentId}/matches`, "error", "Nimate dovoljenja.");
  }

  if (homeTeamId === awayTeamId) {
    redirectWithMessage(`/tournaments/${tournament.slug}/matches`, "error", "Ekipi ne smeta biti isti.");
  }

  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  const round = roundRaw ? Number(roundRaw) : null;

  await prisma.match.create({
    data: {
      tournamentId,
      homeTeamId,
      awayTeamId,
      scheduledAt,
      location: location || null,
      court: court || null,
      round: round || null,
      group: group || null,
    },
  });

  revalidatePath(`/tournaments/${tournament.slug}`);
  revalidatePath(`/tournaments/${tournament.slug}/matches`);
  redirect(`/tournaments/${tournament.slug}/matches`);
}

export async function updateMatchResultAction(formData: FormData) {
  const user = await requireUser();
  const matchId = getString(formData, "matchId");
  const scoreHomeRaw = getString(formData, "scoreHome");
  const scoreAwayRaw = getString(formData, "scoreAway");
  const status = (getString(formData, "status") || "FINISHED") as MatchStatus;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true, homeTeam: true, awayTeam: true },
  });

  if (!match || match.tournament.organizerId !== user.id) {
    redirect("/dashboard");
  }

  const scoreHome = scoreHomeRaw !== "" ? Number(scoreHomeRaw) : null;
  const scoreAway = scoreAwayRaw !== "" ? Number(scoreAwayRaw) : null;

  if (
    status === "FINISHED" &&
    match.tournament.format === "KNOCKOUT" &&
    scoreHome !== null &&
    scoreAway !== null &&
    scoreHome === scoreAway
  ) {
    redirectWithMessage(
      `/tournaments/${match.tournament.slug}/matches`,
      "error",
      "Pri bracket tekmi ne sme biti remija. Vnesi rezultat z zmagovalcem.",
    );
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreHome,
      scoreAway,
      status,
    },
  });

  // Notify followers whose team played
  if (status === "FINISHED" && scoreHome !== null && scoreAway !== null) {
    const followers = await prisma.tournamentFollower.findMany({
      where: {
        tournamentId: match.tournamentId,
        teamId: { in: [match.homeTeamId, match.awayTeamId] },
      },
      select: { userId: true, teamId: true },
    });

    if (followers.length > 0) {
      const homeResult = scoreHome > scoreAway ? "zmagala" : scoreHome < scoreAway ? "izgubila" : "remizirala";
      const awayResult = scoreAway > scoreHome ? "zmagala" : scoreAway < scoreHome ? "izgubila" : "remizirala";

      await prisma.notification.createMany({
        data: followers.map((f) => {
          const isHome = f.teamId === match.homeTeamId;
          const myTeam = isHome ? match.homeTeam.name : match.awayTeam.name;
          const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
          const result = isHome ? homeResult : awayResult;
          const myScore = isHome ? scoreHome : scoreAway;
          const oppScore = isHome ? scoreAway : scoreHome;
          return {
            userId: f.userId,
            title: `Rezultat tekme: ${myTeam}`,
            content: `${myTeam} je ${result} proti ${opponent} (${myScore}:${oppScore}).`,
          };
        }),
      });
    }
  }

  if (status === "FINISHED") {
    await syncFourTeamKnockoutNextMatches(match.tournamentId);
  }

  revalidatePath(`/tournaments/${match.tournament.slug}`);
  revalidatePath(`/tournaments/${match.tournament.slug}/matches`);
  redirect(`/tournaments/${match.tournament.slug}/matches`);
}

export async function setMatchStatusAction(formData: FormData) {
  const user = await requireUser();
  const matchId = getString(formData, "matchId");
  const status = getString(formData, "status") as MatchStatus;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match || match.tournament.organizerId !== user.id) {
    redirect("/dashboard");
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status },
  });

  // Notify followers 30 min before match starts
  if (status === "LIVE") {
    const followers = await prisma.tournamentFollower.findMany({
      where: { tournamentId: match.tournamentId },
      select: { userId: true },
    });

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.userId,
          title: "Tekma se začenja!",
          content: `Tekma na turnirju ${match.tournament.title} je pravkar začela.`,
        })),
      });
    }
  }

  if (status === "FINISHED") {
    await syncFourTeamKnockoutNextMatches(match.tournamentId);
  }

  revalidatePath(`/tournaments/${match.tournament.slug}`);
  revalidatePath(`/tournaments/${match.tournament.slug}/matches`);
  redirect(`/tournaments/${match.tournament.slug}/matches`);
}

export async function generateMatchesAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        where: { status: "CONFIRMED" },
        include: { team: true },
      },
      matches: true,
    },
  });

  if (!tournament || tournament.organizerId !== user.id) {
    redirect("/tournaments");
  }

  const teams = tournament.registrations.map((r) => r.team);
  if (teams.length < 2) {
    redirectWithMessage(`/tournaments/${tournament.slug}/matches`, "error", "Potrebuješ vsaj 2 potrjeni ekipi.");
  }

  const hasActiveMatches = tournament.matches.some(
    (m) => m.status === "LIVE" || m.status === "FINISHED",
  );
  if (hasActiveMatches) {
    redirectWithMessage(`/tournaments/${tournament.slug}/matches`, "error", "Ne moreš regenerirati — obstajajo že aktivne ali zaključene tekme.");
  }

  await prisma.match.deleteMany({ where: { tournamentId } });

  // Naključno premeša ekipe
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const matchData: { tournamentId: string; homeTeamId: string; awayTeamId: string; round: number | null; group: string | null }[] = [];

  const largestFullBracket = 2 ** Math.floor(Math.log2(shuffled.length));
  const playInTeamCount = shuffled.length === largestFullBracket
    ? shuffled.length
    : (shuffled.length - largestFullBracket) * 2;
  const firstRoundTeams = shuffled.slice(-playInTeamCount);

  for (let i = 0; i + 1 < firstRoundTeams.length; i += 2) {
    matchData.push({
      tournamentId,
      homeTeamId: firstRoundTeams[i].id,
      awayTeamId: firstRoundTeams[i + 1].id,
      round: 1,
      group: null,
    });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { format: "KNOCKOUT" },
  });
  await prisma.match.createMany({ data: matchData });

  revalidatePath(`/tournaments/${tournament.slug}`);
  revalidatePath(`/tournaments/${tournament.slug}/matches`);
  redirect(`/tournaments/${tournament.slug}/matches`);
}

export async function deleteMatchAction(formData: FormData) {
  const user = await requireUser();
  const matchId = getString(formData, "matchId");

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match || match.tournament.organizerId !== user.id) {
    redirect("/dashboard");
  }

  await prisma.match.delete({ where: { id: matchId } });

  revalidatePath(`/tournaments/${match.tournament.slug}`);
  revalidatePath(`/tournaments/${match.tournament.slug}/matches`);
  redirect(`/tournaments/${match.tournament.slug}/matches`);
}

// ── Follow / Unfollow ────────────────────────────────────────

export async function followTournamentAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");
  const teamId = getString(formData, "teamId") || null;

  const existing = await prisma.tournamentFollower.findUnique({
    where: { userId_tournamentId: { userId: user.id, tournamentId } },
  });

  if (!existing) {
    await prisma.tournamentFollower.create({
      data: { userId: user.id, tournamentId, teamId },
    });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  revalidatePath("/dashboard");
  if (tournament) revalidatePath(`/tournaments/${tournament.slug}`);
  redirect(tournament ? `/tournaments/${tournament.slug}` : "/dashboard");
}

// ── Zaključi turnir ────────────────────────────────────────────

export async function completeTournamentAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { matches: true },
  });

  if (!tournament || tournament.organizerId !== user.id) {
    redirect("/tournaments");
  }

  const unfinished = tournament.matches.filter(
    (m) => m.status === "UPCOMING" || m.status === "LIVE",
  );

  if (unfinished.length > 0) {
    redirectWithMessage(
      `/tournaments/${tournament.slug}/matches`,
      "error",
      `Še ${unfinished.length} ${unfinished.length === 1 ? "tekma ni" : "tekme niso"} zaključen${unfinished.length === 1 ? "a" : "e"}. Zaključi vse tekme pred arhiviranjem turnirja.`,
    );
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { isCompleted: true },
  });

  // Obvesti prijavljene ekipe
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    select: { userId: true },
  });
  if (registrations.length > 0) {
    await prisma.notification.createMany({
      data: registrations.map((r) => ({
        userId: r.userId,
        title: `Turnir zaključen: ${tournament.title}`,
        content: "Rezultati so uradno potrjeni in se štejejo na globalni lestvici.",
      })),
    });
  }

  revalidatePath(`/tournaments/${tournament.slug}`);
  revalidatePath("/leaderboard");
  redirect(`/tournaments/${tournament.slug}`);
}

export async function unfollowTournamentAction(formData: FormData) {
  const user = await requireUser();
  const tournamentId = getString(formData, "tournamentId");

  await prisma.tournamentFollower.deleteMany({
    where: { userId: user.id, tournamentId },
  });

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  revalidatePath("/dashboard");
  if (tournament) revalidatePath(`/tournaments/${tournament.slug}`);
  redirect(tournament ? `/tournaments/${tournament.slug}` : "/dashboard");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

// ── Admin: ročna podelitev Pro ────────────────────────────────

export async function grantProAction(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  const proUntil = new Date();
  proUntil.setFullYear(proUntil.getFullYear() + 1);
  await prisma.user.update({
    where: { id: userId },
    data: { isPro: true, proUntil },
  });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function revokeProAction(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  await prisma.user.update({
    where: { id: userId },
    data: { isPro: false, proUntil: null },
  });
  revalidatePath("/admin");
  redirect("/admin");
}

// ── Pro Activation (mock payment) ────────────────────────────

export async function activateProAction() {
  const user = await requireUser();

  const proUntil = new Date();
  proUntil.setFullYear(proUntil.getFullYear() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: { isPro: true, proUntil },
  });

  revalidatePath("/dashboard");
  revalidatePath("/upgrade");
  redirect("/dashboard");
}

// ── School License (admin activates) ────────────────────────────

export async function activateSchoolLicenseAction(formData: FormData) {
  await requireAdmin();
  const schoolName = getString(formData, "schoolName");
  const plan = getString(formData, "plan") || "STANDARD";

  if (!isSchoolOption(schoolName)) {
    redirectWithMessage("/admin", "error", "Neveljavna šola.");
  }

  const proUntil = new Date();
  proUntil.setFullYear(proUntil.getFullYear() + 1);

  // Generiraj unikatno invite kodo (6 znakov, velika črka + številke)
  const inviteToken = Array.from({ length: 8 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");

  await (prisma.schoolLicense as any).upsert({
    where: { schoolName },
    create: { schoolName, plan, inviteToken, expiresAt: proUntil },
    update: { plan, inviteToken, expiresAt: proUntil },
  });

  revalidatePath("/admin");
  redirect("/admin");
}
