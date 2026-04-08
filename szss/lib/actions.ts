"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApprovalStatus, UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { createSession, destroySession, requireAdmin, requireUser } from "./auth";
import { slugify } from "./utils";
import { isSchoolOption } from "./schools";

const MAX_SCHOOL_CARD_SIZE = 4.5 * 1024 * 1024;
const ALLOWED_SCHOOL_CARD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithMessage(pathname: string, key: string, message: string): never {
  const params = new URLSearchParams({ [key]: message });
  redirect(`${pathname}?${params.toString()}`);
}

function authTarget(formData: FormData, modal: "login" | "register") {
  const redirectTo = getString(formData, "redirectTo") || "/";
  return redirectTo === "/" ? `/?modal=${modal}` : `/${modal}`;
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
    redirectWithMessage(target, "error", "Naloži sliko šolske kartice.");
  }

  if (file.size > MAX_SCHOOL_CARD_SIZE) {
    redirectWithMessage(target, "error", "Slika kartice je prevelika. Največja dovoljena velikost je 4.5 MB.");
  }

  if (!ALLOWED_SCHOOL_CARD_TYPES.has(file.type)) {
    redirectWithMessage(target, "error", "Dovoljene so samo slike JPG, PNG ali WEBP.");
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
    redirectWithMessage(target, "error", "Ni uporabnika s tem e-poštnim naslovom.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    redirectWithMessage(target, "error", "Napačno geslo.");
  }

  if (user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirectWithMessage(target, "error", "Tvoj račun še ni odobren s strani admina.");
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
  const schoolCard = formData.get("schoolCard");

  if (!fullName || !email || !password || !schoolName) {
    redirectWithMessage(target, "error", "Izpolni vsa obvezna polja.");
  }

  if (!isSchoolOption(schoolName)) {
    redirectWithMessage(target, "error", "Izberi veljavno srednjo šolo s seznama.");
  }

  if (!(schoolCard instanceof File)) {
    redirectWithMessage(target, "error", "Naloži sliko šolske kartice.");
  }

  validateSchoolCard(schoolCard, target);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    redirectWithMessage(target, "error", "Ta e-poštni naslov je že uporabljen.");
  }

  let schoolCardImage: string;

  try {
    schoolCardImage = await saveSchoolCard(schoolCard);
  } catch {
    redirectWithMessage(
      target,
      "error",
      "Nalagalnik kartic trenutno ni na voljo. Poskusi znova čez nekaj trenutkov.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      schoolName,
      schoolCardImage,
      role: UserRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.PENDING,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "Nova registracija čaka na odobritev",
        content: `${fullName} je oddal registracijo za šolo ${schoolName}.`,
      })),
    });
  }

  redirect("/?modal=login&registered=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createTournamentAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const title = getString(formData, "title");
  const sport = getString(formData, "sport");
  const location = getString(formData, "location");
  const description = getString(formData, "description");
  const maxTeams = Number(getString(formData, "maxTeams"));
  const date = new Date(getString(formData, "date"));

  if (!title || !sport || !location || !description || !maxTeams || Number.isNaN(date.getTime())) {
    redirectWithMessage("/tournaments/create", "error", "Preveri vsa polja turnirja.");
  }

  let slug = slugify(title);
  let suffix = 1;

  while (await prisma.tournament.findUnique({ where: { slug } })) {
    slug = `${slugify(title)}-${suffix}`;
    suffix += 1;
  }

  await prisma.tournament.create({
    data: {
      title,
      slug,
      sport,
      location,
      description,
      maxTeams,
      date,
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

  if (!content) {
    redirect("/tournaments");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
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

  revalidatePath(`/tournaments/${tournament.slug}`);
  redirect(`/tournaments/${tournament.slug}`);
}
