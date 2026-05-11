import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";

const { PrismaClient, UserRole, ApprovalStatus } = prismaPkg;
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

// ─── Gesla ────────────────────────────────────────────────────
// admin@szss.si      → Admin123!
// pro@szss.si        → Dijak123!
// luka@szss.si       → Dijak123!
// nina@szss.si       → Dijak123!
// tilen@szss.si      → Dijak123!
// pending@szss.si    → Dijak123!   (čaka na odobritev)

const SCHOOL_A = "Šolski center Kranj, Srednja tehniška šola";
const SCHOOL_B = "Gimnazija Kranj";
const SCHOOL_C = "Šolski center Velenje";

async function upsertUser({ email, fullName, role, passwordHash, schoolName, approvalStatus = "APPROVED", isPro = false, proUntil = null }) {
  return prisma.user.upsert({
    where: { email },
    update: { fullName, schoolName, role, approvalStatus, passwordHash, isPro, proUntil },
    create: { email, fullName, schoolName, role, approvalStatus, passwordHash, isPro, proUntil },
  });
}

async function main() {
  const adminPwd = await bcrypt.hash("Admin123!", 10);
  const dijakPwd = await bcrypt.hash("Dijak123!", 10);
  const proUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // ─── Uporabniki ───────────────────────────────────────────────
  const admin = await upsertUser({
    email: "admin@szss.si",
    fullName: "Admin ŠZSŠ",
    role: UserRole.ADMIN,
    passwordHash: adminPwd,
    schoolName: SCHOOL_A,
    isPro: true,
  });

  const pro = await upsertUser({
    email: "pro@szss.si",
    fullName: "Maja Novak",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_A,
    isPro: true,
    proUntil,
  });

  const luka = await upsertUser({
    email: "luka@szss.si",
    fullName: "Luka Horvat",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_A,
  });

  const nina = await upsertUser({
    email: "nina@szss.si",
    fullName: "Nina Kranjc",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_B,
  });

  const tilen = await upsertUser({
    email: "tilen@szss.si",
    fullName: "Tilen Kos",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_B,
  });

  const anja = await upsertUser({
    email: "anja@szss.si",
    fullName: "Anja Zupan",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_C,
  });

  const pending = await upsertUser({
    email: "pending@szss.si",
    fullName: "Rok Petek",
    role: UserRole.PARTICIPANT,
    passwordHash: dijakPwd,
    schoolName: SCHOOL_C,
    approvalStatus: ApprovalStatus.PENDING,
  });

  console.log("✓ Uporabniki ustvarjeni");

  // ─── Turnirji ─────────────────────────────────────────────────
  const tournaments = [
    {
      slug: "pomladni-futsal-pokal-2026",
      title: "Pomladni futsal pokal 2026",
      sport: "Futsal",
      description: "Medšolski futsal turnir za srednje šole Gorenjske. Skupinski del + izločilni boji.",
      location: "Športna dvorana Kranj",
      date: new Date("2026-06-10T09:00:00.000Z"),
      maxTeams: 8,
      format: "GROUP_STAGE",
      organizerId: admin.id,
    },
    {
      slug: "kosarkarski-izziv-kranj",
      title: "Košarkarski izziv Kranj",
      sport: "Košarka",
      description: "Turnir v košarki za šole Gorenjske regije. Tri ekipe po skupino, finale.",
      location: "Dvorana OŠ Stražišče",
      date: new Date("2026-07-05T10:00:00.000Z"),
      maxTeams: 6,
      format: "COMBINED",
      organizerId: pro.id,
    },
    {
      slug: "odbojka-velenje-2026",
      title: "Odbojka Velenje 2026",
      sport: "Odbojka",
      description: "Regijsko odbojkarsko tekmovanje za dijakinje in dijake.",
      location: "Mestna hala Velenje",
      date: new Date("2026-09-20T08:00:00.000Z"),
      maxTeams: 10,
      format: "GROUP_STAGE",
      organizerId: pro.id,
    },
    {
      slug: "testni-bracket-10-ekip",
      title: "Testni bracket 10 ekip",
      sport: "Futsal",
      description: "Demo knockout turnir z 10 nosilci za preverjanje prikaza bracket sheme.",
      location: "Testna dvorana",
      date: new Date("2026-06-18T09:00:00.000Z"),
      maxTeams: 10,
      format: "KNOCKOUT",
      organizerId: admin.id,
      isCompleted: true,
    },
  ];

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }

  const futsal = await prisma.tournament.findUniqueOrThrow({ where: { slug: "pomladni-futsal-pokal-2026" } });
  const kosarka = await prisma.tournament.findUniqueOrThrow({ where: { slug: "kosarkarski-izziv-kranj" } });
  const bracket10 = await prisma.tournament.findUniqueOrThrow({ where: { slug: "testni-bracket-10-ekip" } });

  console.log("✓ Turnirji ustvarjeni");

  // ─── Ekipe ────────────────────────────────────────────────────
  const teams = [
    { id: "team-sck-volkovi",   name: "SCK Volkovi",      sport: "Futsal",   schoolName: SCHOOL_A, createdById: luka.id },
    { id: "team-sck-orlci",     name: "SCK Orli",         sport: "Futsal",   schoolName: SCHOOL_A, createdById: pro.id },
    { id: "team-gim-sokolci",   name: "GK Sokolci",       sport: "Futsal",   schoolName: SCHOOL_B, createdById: nina.id },
    { id: "team-vel-borci",     name: "Velenje Borci",    sport: "Futsal",   schoolName: SCHOOL_C, createdById: anja.id },
    { id: "team-sck-kosarkarji",name: "SCK Košarkarji",   sport: "Košarka",  schoolName: SCHOOL_A, createdById: luka.id },
    { id: "team-gim-reketi",    name: "GK Reketi",        sport: "Košarka",  schoolName: SCHOOL_B, createdById: tilen.id },
    { id: "team-bracket-01",    name: "Seed 1 - SCK Alfa", sport: "Futsal",   schoolName: SCHOOL_A, createdById: admin.id },
    { id: "team-bracket-02",    name: "Seed 2 - GK Beta", sport: "Futsal",    schoolName: SCHOOL_B, createdById: nina.id },
    { id: "team-bracket-03",    name: "Seed 3 - Velenje Gama", sport: "Futsal", schoolName: SCHOOL_C, createdById: anja.id },
    { id: "team-bracket-04",    name: "Seed 4 - SCK Delta", sport: "Futsal",  schoolName: SCHOOL_A, createdById: pro.id },
    { id: "team-bracket-05",    name: "Seed 5 - GK Epsilon", sport: "Futsal", schoolName: SCHOOL_B, createdById: tilen.id },
    { id: "team-bracket-06",    name: "Seed 6 - Velenje Zeta", sport: "Futsal", schoolName: SCHOOL_C, createdById: anja.id },
    { id: "team-bracket-07",    name: "Seed 7 - SCK Eta", sport: "Futsal",    schoolName: SCHOOL_A, createdById: luka.id },
    { id: "team-bracket-08",    name: "Seed 8 - GK Theta", sport: "Futsal",   schoolName: SCHOOL_B, createdById: nina.id },
    { id: "team-bracket-09",    name: "Seed 9 - Velenje Iota", sport: "Futsal", schoolName: SCHOOL_C, createdById: anja.id },
    { id: "team-bracket-10",    name: "Seed 10 - SCK Kapa", sport: "Futsal",  schoolName: SCHOOL_A, createdById: pro.id },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: team,
      create: team,
    });
  }

  // Člani ekip
  const memberships = [
    { teamId: "team-sck-volkovi",    userId: luka.id,  fullName: luka.fullName,  position: "Napadalec" },
    { teamId: "team-sck-volkovi",    userId: pro.id,   fullName: pro.fullName,   position: "Vratar" },
    { teamId: "team-sck-volkovi",    userId: admin.id, fullName: admin.fullName, position: "Branilec" },
    { teamId: "team-sck-orlci",      userId: pro.id,   fullName: pro.fullName,   position: "Kapetan" },
    { teamId: "team-sck-orlci",      userId: admin.id, fullName: admin.fullName, position: "Napadalec" },
    { teamId: "team-gim-sokolci",    userId: nina.id,  fullName: nina.fullName,  position: "Kapetan" },
    { teamId: "team-gim-sokolci",    userId: tilen.id, fullName: tilen.fullName, position: "Branilec" },
    { teamId: "team-vel-borci",      userId: anja.id,  fullName: anja.fullName,  position: "Kapetan" },
    { teamId: "team-sck-kosarkarji", userId: luka.id,  fullName: luka.fullName,  position: "Point Guard" },
    { teamId: "team-sck-kosarkarji", userId: pro.id,   fullName: pro.fullName,   position: "Center" },
    { teamId: "team-gim-reketi",     userId: tilen.id, fullName: tilen.fullName, position: "Shooting Guard" },
    { teamId: "team-gim-reketi",     userId: nina.id,  fullName: nina.fullName,  position: "Forward" },
  ];

  for (const m of memberships) {
    const exists = await prisma.teamMember.findFirst({ where: { teamId: m.teamId, userId: m.userId } });
    if (!exists) await prisma.teamMember.create({ data: m });
  }

  console.log("✓ Ekipe in člani ustvarjeni");

  // ─── Prijave na turnirje ───────────────────────────────────────
  const registrations = [
    { tournamentId: futsal.id, teamId: "team-sck-volkovi",    userId: luka.id },
    { tournamentId: futsal.id, teamId: "team-sck-orlci",      userId: pro.id },
    { tournamentId: futsal.id, teamId: "team-gim-sokolci",    userId: nina.id },
    { tournamentId: futsal.id, teamId: "team-vel-borci",      userId: anja.id },
    { tournamentId: kosarka.id, teamId: "team-sck-kosarkarji", userId: luka.id },
    { tournamentId: kosarka.id, teamId: "team-gim-reketi",    userId: tilen.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-01", userId: admin.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-02", userId: nina.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-03", userId: anja.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-04", userId: pro.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-05", userId: tilen.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-06", userId: anja.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-07", userId: luka.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-08", userId: nina.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-09", userId: anja.id },
    { tournamentId: bracket10.id, teamId: "team-bracket-10", userId: pro.id },
  ];

  for (const reg of registrations) {
    await prisma.tournamentRegistration.upsert({
      where: { tournamentId_teamId: { tournamentId: reg.tournamentId, teamId: reg.teamId } },
      update: { userId: reg.userId },
      create: { ...reg, status: "CONFIRMED" },
    });
  }

  console.log("✓ Prijave ustvarjene");

  // ─── Tekme futsala ────────────────────────────────────────────
  const futsalMatches = [
    {
      id: "match-f1", tournamentId: futsal.id,
      homeTeamId: "team-sck-volkovi", awayTeamId: "team-gim-sokolci",
      scoreHome: 4, scoreAway: 2, status: "FINISHED", round: 1, group: "A",
      scheduledAt: new Date("2026-06-10T09:30:00.000Z"),
    },
    {
      id: "match-f2", tournamentId: futsal.id,
      homeTeamId: "team-sck-orlci", awayTeamId: "team-vel-borci",
      scoreHome: 3, scoreAway: 3, status: "FINISHED", round: 1, group: "A",
      scheduledAt: new Date("2026-06-10T10:00:00.000Z"),
    },
    {
      id: "match-f3", tournamentId: futsal.id,
      homeTeamId: "team-sck-volkovi", awayTeamId: "team-vel-borci",
      scoreHome: 5, scoreAway: 1, status: "FINISHED", round: 2, group: "A",
      scheduledAt: new Date("2026-06-10T11:00:00.000Z"),
    },
    {
      id: "match-f4", tournamentId: futsal.id,
      homeTeamId: "team-gim-sokolci", awayTeamId: "team-sck-orlci",
      scoreHome: null, scoreAway: null, status: "UPCOMING", round: 2, group: "A",
      scheduledAt: new Date("2026-06-10T13:00:00.000Z"),
    },
  ];

  for (const m of futsalMatches) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // Tekme košarke
  const kosarkaMatches = [
    {
      id: "match-k1", tournamentId: kosarka.id,
      homeTeamId: "team-sck-kosarkarji", awayTeamId: "team-gim-reketi",
      scoreHome: 68, scoreAway: 54, status: "FINISHED", round: 1,
      scheduledAt: new Date("2026-07-05T10:00:00.000Z"),
    },
    {
      id: "match-k2", tournamentId: kosarka.id,
      homeTeamId: "team-gim-reketi", awayTeamId: "team-sck-kosarkarji",
      scoreHome: null, scoreAway: null, status: "UPCOMING", round: 2,
      scheduledAt: new Date("2026-07-05T13:00:00.000Z"),
    },
  ];

  for (const m of kosarkaMatches) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // Testni 10-team knockout bracket
  const bracketMatches = [
    {
      id: "match-b10-r1-1", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-08", awayTeamId: "team-bracket-09",
      scoreHome: 3, scoreAway: 1, status: "FINISHED", round: 1,
      scheduledAt: new Date("2026-06-18T09:00:00.000Z"),
    },
    {
      id: "match-b10-r1-2", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-07", awayTeamId: "team-bracket-10",
      scoreHome: 2, scoreAway: 4, status: "FINISHED", round: 1,
      scheduledAt: new Date("2026-06-18T09:30:00.000Z"),
    },
    {
      id: "match-b10-r2-1", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-01", awayTeamId: "team-bracket-08",
      scoreHome: 5, scoreAway: 2, status: "FINISHED", round: 2,
      scheduledAt: new Date("2026-06-18T10:30:00.000Z"),
    },
    {
      id: "match-b10-r2-2", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-04", awayTeamId: "team-bracket-05",
      scoreHome: 1, scoreAway: 0, status: "FINISHED", round: 2,
      scheduledAt: new Date("2026-06-18T11:00:00.000Z"),
    },
    {
      id: "match-b10-r2-3", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-03", awayTeamId: "team-bracket-06",
      scoreHome: 3, scoreAway: 2, status: "FINISHED", round: 2,
      scheduledAt: new Date("2026-06-18T11:30:00.000Z"),
    },
    {
      id: "match-b10-r2-4", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-02", awayTeamId: "team-bracket-10",
      scoreHome: 3, scoreAway: 1, status: "FINISHED", round: 2,
      scheduledAt: new Date("2026-06-18T12:00:00.000Z"),
    },
    {
      id: "match-b10-r3-1", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-01", awayTeamId: "team-bracket-04",
      scoreHome: 2, scoreAway: 1, status: "FINISHED", round: 3,
      scheduledAt: new Date("2026-06-18T13:30:00.000Z"),
    },
    {
      id: "match-b10-r3-2", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-03", awayTeamId: "team-bracket-02",
      scoreHome: 1, scoreAway: 3, status: "FINISHED", round: 3,
      scheduledAt: new Date("2026-06-18T14:00:00.000Z"),
    },
    {
      id: "match-b10-r4-1", tournamentId: bracket10.id,
      homeTeamId: "team-bracket-01", awayTeamId: "team-bracket-02",
      scoreHome: 4, scoreAway: 2, status: "FINISHED", round: 4,
      scheduledAt: new Date("2026-06-18T15:30:00.000Z"),
    },
  ];

  for (const m of bracketMatches) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  console.log("✓ Tekme ustvarjene");

  // ─── Objave ───────────────────────────────────────────────────
  const ann1 = await prisma.announcement.findFirst({ where: { title: "Prijave so odprte" } });
  if (!ann1) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "Prijave so odprte",
          content: "Prijave za futsal in košarko so odprte. Ekipe se prijavite do zapolnitve mest!",
        },
        {
          title: "Razpored iger – Futsal",
          content: "Objavljen je razpored iger za futsal pokal. Ekipe prosimo, da prispejo vsaj 30 minut pred tekmo.",
          tournamentId: futsal.id,
        },
        {
          title: "Pravila turnirja",
          content: "Vsaka ekipa igra 2 tekmi v skupinskem delu. Top 2 napredujeta v polfinale. Prijave možne do zapolnitve.",
          tournamentId: kosarka.id,
        },
      ],
    });
  }

  // ─── Obvestila ────────────────────────────────────────────────
  const notifExists = await prisma.notification.findFirst({ where: { userId: admin.id, title: "Nova prijava ekipe" } });
  if (!notifExists) {
    await prisma.notification.createMany({
      data: [
        { userId: admin.id, title: "Nova prijava ekipe", content: "Ekipa SCK Volkovi se je prijavila na Pomladni futsal pokal.", isRead: false },
        { userId: admin.id, title: "Nova prijava ekipe", content: "Ekipa GK Sokolci se je prijavila na Pomladni futsal pokal.", isRead: false },
        { userId: admin.id, title: "Sistem pripravljen", content: "Baza podatkov je uspešno inicializirana.", isRead: true },
        { userId: luka.id,  title: "Prijava potrjena", content: "Ekipa SCK Volkovi je potrjena na Pomladnem futsal pokalu.", isRead: false },
        { userId: luka.id,  title: "Rezultat tekme", content: "SCK Volkovi vs GK Sokolci – 4:2. Čestitamo!", isRead: false },
        { userId: nina.id,  title: "Prijava potrjena", content: "Ekipa GK Sokolci je potrjena na Pomladnem futsal pokalu.", isRead: true },
        { userId: nina.id,  title: "Rezultat tekme", content: "GK Sokolci vs SCK Volkovi – 2:4. Boljši naslednjič!", isRead: false },
        { userId: pro.id,   title: "Tvoj turnir čaka", content: "Košarkarski izziv Kranj ima 2 prijavljeni ekipi.", isRead: true },
      ],
    });
  }

  // ─── Sporočila ────────────────────────────────────────────────
  const msgExists = await prisma.message.findFirst({ where: { tournamentId: futsal.id, senderId: admin.id } });
  if (!msgExists) {
    await prisma.message.createMany({
      data: [
        {
          tournamentId: futsal.id, senderId: admin.id, senderName: admin.fullName,
          content: "Pozdravljeni! Prosim potrdite prihod ekip do 8:30. Garderobe odprte ob 8:00.",
        },
        {
          tournamentId: futsal.id, senderId: luka.id, senderName: luka.fullName,
          content: "SCK Volkovi bo prisotna ob 8:15. Hvala za organizacijo!",
        },
        {
          tournamentId: kosarka.id, senderId: pro.id, senderName: pro.fullName,
          content: "Žoge so zagotovljene. Prosim vsaka ekipa prinese svojo rezervno žogo.",
        },
      ],
    });
  }

  console.log("✓ Objave, obvestila in sporočila ustvarjena");

  // ─── Povzetek ─────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          PRIJAVNI PODATKI                ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log("║  admin@szss.si     → Admin123!  (ADMIN)  ║");
  console.log("║  pro@szss.si       → Dijak123!  (PRO)    ║");
  console.log("║  luka@szss.si      → Dijak123!  (FREE)   ║");
  console.log("║  nina@szss.si      → Dijak123!  (FREE)   ║");
  console.log("║  tilen@szss.si     → Dijak123!  (FREE)   ║");
  console.log("║  anja@szss.si      → Dijak123!  (FREE)   ║");
  console.log("║  pending@szss.si   → Dijak123!  (ČAKA)   ║");
  console.log("╚══════════════════════════════════════════╝\n");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
