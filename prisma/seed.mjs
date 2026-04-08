import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";

const { PrismaClient, UserRole, ApprovalStatus } = prismaPkg;
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

const DEMO_SCHOOL = "Šolski center Kranj, Srednja tehniška šola";

async function upsertUser({ email, fullName, role, passwordHash, schoolName }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      schoolName,
      role,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
    },
    create: {
      fullName,
      email,
      schoolName,
      role,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
    },
  });
}

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const organizerPassword = await bcrypt.hash("Organizer123!", 10);
  const participantPassword = await bcrypt.hash("Dijak123!", 10);

  const admin = await upsertUser({
    email: "admin@szss.si",
    fullName: "Admin ŠZSŠ",
    role: UserRole.ADMIN,
    passwordHash: adminPassword,
    schoolName: DEMO_SCHOOL,
  });

  const organizer = await upsertUser({
    email: "sportni.mentor@szss.si",
    fullName: "Matej Novak",
    role: UserRole.ORGANIZER,
    passwordHash: organizerPassword,
    schoolName: DEMO_SCHOOL,
  });

  const participant = await upsertUser({
    email: "dijak@szss.si",
    fullName: "Luka Horvat",
    role: UserRole.PARTICIPANT,
    passwordHash: participantPassword,
    schoolName: DEMO_SCHOOL,
  });

  const schoolmate1 = await upsertUser({
    email: "nina.kranjc@szss.si",
    fullName: "Nina Kranjc",
    role: UserRole.PARTICIPANT,
    passwordHash: participantPassword,
    schoolName: DEMO_SCHOOL,
  });

  const schoolmate2 = await upsertUser({
    email: "tilen.kos@szss.si",
    fullName: "Tilen Kos",
    role: UserRole.PARTICIPANT,
    passwordHash: participantPassword,
    schoolName: DEMO_SCHOOL,
  });

  const tournaments = [
    {
      title: "Pomladni futsal pokal",
      slug: "pomladni-futsal-pokal",
      sport: "Futsal",
      description:
        "Medšolski futsal turnir za srednje šole z zaključnim finalom v športni dvorani.",
      location: "Športna dvorana Kranj",
      date: new Date("2026-05-12T09:00:00.000Z"),
      maxTeams: 8,
    },
    {
      title: "Odbojkarski izziv regije",
      slug: "odbojkarski-izziv-regije",
      sport: "Odbojka",
      description:
        "Celodnevni turnir z razvrstitvenimi tekmami, finalom in podelitvijo priznanj.",
      location: "Mestna športna hala",
      date: new Date("2026-05-24T08:30:00.000Z"),
      maxTeams: 10,
    },
    {
      title: "Jesenski košarkarski masters",
      slug: "jesenski-kosarkarski-masters",
      sport: "Košarka",
      description:
        "Turnir za šolske ekipe z elektronsko prijavo, objavami in sprotnim obveščanjem.",
      location: "Šolsko igrišče Kranj",
      date: new Date("2026-09-18T10:00:00.000Z"),
      maxTeams: 6,
    },
  ];

  for (const tournament of tournaments) {
    await prisma.tournament.upsert({
      where: { slug: tournament.slug },
      update: {
        ...tournament,
        organizerId: organizer.id,
      },
      create: {
        ...tournament,
        organizerId: organizer.id,
      },
    });
  }

  const futsal = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "pomladni-futsal-pokal" },
  });

  const team = await prisma.team.upsert({
    where: { id: "team-sck-volkovi" },
    update: {
      name: "SCK Volkovi",
      sport: "Futsal",
      schoolName: DEMO_SCHOOL,
      createdById: organizer.id,
    },
    create: {
      id: "team-sck-volkovi",
      name: "SCK Volkovi",
      sport: "Futsal",
      schoolName: DEMO_SCHOOL,
      createdById: organizer.id,
    },
  });

  const memberships = [organizer, participant, schoolmate1, schoolmate2];
  for (const member of memberships) {
    const exists = await prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId: member.id,
      },
    });

    if (!exists) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: member.id,
          fullName: member.fullName,
        },
      });
    }
  }

  await prisma.tournamentRegistration.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId: futsal.id,
        teamId: team.id,
      },
    },
    update: {
      userId: participant.id,
    },
    create: {
      tournamentId: futsal.id,
      teamId: team.id,
      userId: participant.id,
    },
  });

  const announcementExists = await prisma.announcement.findFirst({
    where: { title: "Prijave odprte za pomladni del" },
  });

  if (!announcementExists) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "Prijave odprte za pomladni del",
          content:
            "Prijave ekip za futsal in odbojko so odprte do zapolnitve mest. Organizatorji spremljajte prijave v nadzorni plošči.",
        },
        {
          title: "Objavljen urnik ogrevanja",
          content:
            "Za futsal pokal je na strani turnirja objavljen predlog prihodov ekip in ogrevanja.",
          tournamentId: futsal.id,
        },
      ],
    });
  }

  const notificationExists = await prisma.notification.findFirst({
    where: {
      userId: organizer.id,
      title: "Nova prijava ekipe",
    },
  });

  if (!notificationExists) {
    await prisma.notification.createMany({
      data: [
        {
          userId: organizer.id,
          title: "Nova prijava ekipe",
          content: "Ekipa SCK Volkovi je prijavljena na Pomladni futsal pokal.",
        },
        {
          userId: participant.id,
          title: "Turnir potrjen",
          content: "Tvoja prijava na Pomladni futsal pokal je uspešno potrjena.",
        },
        {
          userId: admin.id,
          title: "Sistem pripravljen",
          content: "Športna zveza srednjih šol je pripravljena za pregled in odobritve uporabnikov.",
        },
      ],
    });
  }

  const messageExists = await prisma.message.findFirst({
    where: {
      tournamentId: futsal.id,
      senderId: organizer.id,
    },
  });

  if (!messageExists) {
    await prisma.message.create({
      data: {
        tournamentId: futsal.id,
        senderId: organizer.id,
        senderName: organizer.fullName,
        content:
          "Pozdravljeni, prosim potrdite prihod ekip do 8:30. Garderobe bodo odprte ob 8:00.",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
