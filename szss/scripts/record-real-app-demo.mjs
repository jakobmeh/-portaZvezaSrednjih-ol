import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { chromium } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const { PrismaClient, UserRole, ApprovalStatus } = prismaPkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "..", "video-output");
const finalVideoPath = path.join(outputDir, "szss-predstavitveni-video-realna-aplikacija.webm");
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

if (!connectionString) {
  throw new Error("Manjka DATABASE_URL/DIRECT_URL v .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function prepareDemoData() {
  const passwordHash = await bcrypt.hash("Video123!", 10);
  const organizer = await prisma.user.upsert({
    where: { email: "video-demo@szss.si" },
    update: {
      fullName: "Jakob Demo",
      schoolName: "Biotehniški center Naklo, Srednja šola",
      role: UserRole.ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
      isPro: true,
    },
    create: {
      email: "video-demo@szss.si",
      fullName: "Jakob Demo",
      schoolName: "Biotehniški center Naklo, Srednja šola",
      role: UserRole.ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
      isPro: true,
    },
  });

  const tournament = await prisma.tournament.upsert({
    where: { slug: "video-demo-bracket" },
    update: {
      title: "SZSS predstavitveni bracket",
      sport: "Futsal",
      description: "Demo turnir za predstavitveni video aplikacije.",
      location: "Športna dvorana Naklo",
      date: new Date("2026-06-12T09:00:00.000Z"),
      maxTeams: 4,
      format: "KNOCKOUT",
      organizerId: organizer.id,
      isCompleted: true,
    },
    create: {
      slug: "video-demo-bracket",
      title: "SZSS predstavitveni bracket",
      sport: "Futsal",
      description: "Demo turnir za predstavitveni video aplikacije.",
      location: "Športna dvorana Naklo",
      date: new Date("2026-06-12T09:00:00.000Z"),
      maxTeams: 4,
      format: "KNOCKOUT",
      organizerId: organizer.id,
      isCompleted: true,
    },
  });

  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: tournament.id } });

  const teamSpecs = [
    ["video-team-bc-naklo", "BC Naklo"],
    ["video-team-jakob", "Jakob Meh"],
    ["video-team-sc-kranj", "SC Kranj"],
    ["video-team-gimnazija", "Gimnazija Kranj"],
  ];

  for (const [id, name] of teamSpecs) {
    await prisma.team.upsert({
      where: { id },
      update: { name, sport: "Futsal", schoolName: "Biotehniški center Naklo, Srednja šola", createdById: organizer.id },
      create: { id, name, sport: "Futsal", schoolName: "Biotehniški center Naklo, Srednja šola", createdById: organizer.id },
    });
    await prisma.tournamentRegistration.create({
      data: { tournamentId: tournament.id, teamId: id, userId: organizer.id, status: "CONFIRMED" },
    });
  }

  await prisma.match.createMany({
    data: [
      {
        tournamentId: tournament.id,
        homeTeamId: "video-team-bc-naklo",
        awayTeamId: "video-team-jakob",
        scoreHome: 3,
        scoreAway: 1,
        status: "FINISHED",
        round: 1,
        court: "Igrišče 1",
      },
      {
        tournamentId: tournament.id,
        homeTeamId: "video-team-sc-kranj",
        awayTeamId: "video-team-gimnazija",
        scoreHome: 2,
        scoreAway: 0,
        status: "FINISHED",
        round: 1,
        court: "Igrišče 2",
      },
      {
        tournamentId: tournament.id,
        homeTeamId: "video-team-bc-naklo",
        awayTeamId: "video-team-sc-kranj",
        scoreHome: 4,
        scoreAway: 2,
        status: "FINISHED",
        round: 2,
        group: "Finale",
        court: "Igrišče 1",
      },
      {
        tournamentId: tournament.id,
        homeTeamId: "video-team-jakob",
        awayTeamId: "video-team-gimnazija",
        scoreHome: 2,
        scoreAway: 1,
        status: "FINISHED",
        round: 2,
        group: "Tekma za 3. mesto",
        court: "Igrišče 2",
      },
    ],
  });

  return { email: "video-demo@szss.si", password: "Video123!" };
}

async function caption(page, title, detail) {
  await page.evaluate(({ title, detail }) => {
    let el = document.querySelector("#video-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "video-caption";
      document.body.appendChild(el);
    }
    el.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  }, { title, detail });
}

async function setupCaptionStyle(page) {
  await page.addStyleTag({
    content: `
      #video-caption {
        position: fixed;
        left: 40px;
        bottom: 32px;
        z-index: 999999;
        max-width: 560px;
        padding: 16px 18px;
        border: 1px solid rgba(43,175,58,.38);
        border-radius: 12px;
        background: rgba(7,9,15,.9);
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
        color: #f4f7fb;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      }
      #video-caption strong {
        display: block;
        margin-bottom: 5px;
        font-size: 18px;
        font-weight: 900;
      }
      #video-caption span {
        display: block;
        color: #9aa7bb;
        font-size: 13px;
        font-weight: 650;
        line-height: 1.45;
      }
    `,
  });
}

async function scene(page, title, detail, ms = 3500) {
  await setupCaptionStyle(page).catch(() => {});
  await caption(page, title, detail);
  await page.waitForTimeout(ms);
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const credentials = await prepareDemoData();

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: outputDir, size: { width: 1280, height: 720 } },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20000 });

  await scene(page, "Nadzorna plošča", "Pregled turnirjev, ekip, obvestil in hitrih povezav.", 3800);

  await page.goto(`${baseUrl}/tournaments`, { waitUntil: "networkidle" });
  await scene(page, "Turnirji", "Organizator vidi turnirje in stanje prijav.", 3600);

  await page.goto(`${baseUrl}/tournaments/video-demo-bracket`, { waitUntil: "networkidle" });
  await scene(page, "Stran turnirja", "Prikaz ekip, tekem, bracket sheme in lestvice.", 4200);

  await page.goto(`${baseUrl}/tournaments/video-demo-bracket/matches`, { waitUntil: "networkidle" });
  await scene(page, "Upravljanje tekem", "Rezultati so vpisani neposredno na tekmah.", 4200);

  await page.mouse.move(230, 190, { steps: 24 });
  await page.mouse.move(585, 275, { steps: 40 });
  await scene(page, "Bracket", "Zmagovalci polfinala so v finalu, poraženci v tekmi za 3. mesto.", 4500);

  await page.goto(`${baseUrl}/tournaments/video-demo-bracket`, { waitUntil: "networkidle" });
  await scene(page, "Končna lestvica", "1. mesto dobi 3 točke, 2. mesto 2 točki, 3. mesto 1 točko.", 5200);

  await page.goto(`${baseUrl}/leaderboard`, { waitUntil: "networkidle" });
  await scene(page, "Globalna lestvica", "Zaključen turnir objavi rezultate na lestvici.", 4200);

  const video = page.video();
  await context.close();
  await browser.close();

  const recordedPath = await video.path();
  await fs.copyFile(recordedPath, finalVideoPath);
  await prisma.$disconnect();

  console.log(finalVideoPath);
}

main().catch(async (error) => {
  await prisma.$disconnect().catch(() => {});
  console.error(error);
  process.exit(1);
});
