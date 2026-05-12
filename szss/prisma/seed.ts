import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function normalizeConn(raw: string) {
  const url = new URL(raw);
  const ssl = url.searchParams.get("sslmode");
  if (ssl === "prefer" || ssl === "require" || ssl === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const rawConn = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
if (!rawConn) throw new Error("Manjka DATABASE_URL v .env");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: normalizeConn(rawConn) }),
});

async function main() {
  // ── 1. Account ────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("test1234", 10);

  const jakob = await prisma.user.upsert({
    where: { email: "jakobmehmc1@gmail.com" },
    update: {
      fullName: "Jakob M.",
      passwordHash: hash,
      schoolName: "Elektro in računalniška šola Velenje",
      role: "ADMIN",
      approvalStatus: "APPROVED",
      isPro: false,
      proUntil: null,
    },
    create: {
      email: "jakobmehmc1@gmail.com",
      fullName: "Jakob M.",
      passwordHash: hash,
      schoolName: "Elektro in računalniška šola Velenje",
      role: "ADMIN",
      approvalStatus: "APPROVED",
      isPro: false,
    },
  });

  console.log("✓ Account:", jakob.email, `(${jakob.role})`);

  // ── 2. 3 futsalske ekipe ───────────────────────────────────────────────────
  const teamsData = [
    {
      name: "Šarci FC",
      schoolName: "Elektro in računalniška šola Velenje",
      players: ["Luka Novak", "Matej Horvat", "Rok Kovač", "Anže Potočnik", "Miha Zupan", "Jure Lešnik"],
    },
    {
      name: "Rdeče Zvezde",
      schoolName: "Šolski center Velenje",
      players: ["Blaž Krajnc", "Tim Oblak", "Nik Berger", "Jan Vidmar", "Žiga Golob", "Luka Petek"],
    },
    {
      name: "Vulkani United",
      schoolName: "Tehniška šola Šoštanj",
      players: ["Klemen Šarc", "David Žnidaršič", "Gal Erjavec", "Tilen Hren", "Matic Černe", "Rok Jesenko"],
    },
  ];

  for (const td of teamsData) {
    const existing = await prisma.team.findFirst({ where: { name: td.name } });
    if (existing) {
      console.log(`~ Ekipa obstaja: ${td.name}`);
      continue;
    }
    const team = await prisma.team.create({
      data: {
        name: td.name,
        sport: "Nogomet",
        schoolName: td.schoolName,
        createdById: jakob.id,
        players: { create: td.players.map((fullName) => ({ fullName })) },
      },
    });
    console.log(`✓ Ekipa: ${team.name}  —  ${td.schoolName}  (${td.players.length} igralcev)`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Prijavi se z:");
  console.log("    Email:  jakobmehmc1@gmail.com");
  console.log("    Geslo:  test1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  3 nogometne ekipe čakajo → ustvari turnir");
  console.log("  in registriraj ekipe!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
