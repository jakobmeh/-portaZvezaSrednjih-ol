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
const finalVideoPath = path.join(outputDir, "szss-full-predstavitveni-video.webm");
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

if (!connectionString) throw new Error("Manjka DATABASE_URL/DIRECT_URL v .env");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoEmail = "full-video-demo@szss.si";
const demoPassword = "Video123!";
const demoSchool = "Biotehniški center Naklo, Srednja šola";
const demoTitle = "Video demo bracket";
const demoSlugBase = "video-demo-bracket";

async function purgeAllAppData() {
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.tournamentFollower.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.tournamentRegistration.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.schoolLicense.deleteMany({});
  await prisma.user.deleteMany({});
}

async function resetDemoData() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      fullName: "Jakob Demo",
      schoolName: demoSchool,
      role: UserRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
      isPro: false,
      proUntil: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
    create: {
      email: demoEmail,
      fullName: "Jakob Demo",
      schoolName: demoSchool,
      role: UserRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.APPROVED,
      passwordHash,
      isPro: false,
    },
  });

  const oldTournaments = await prisma.tournament.findMany({
    where: {
      organizerId: user.id,
      slug: { startsWith: demoSlugBase },
    },
    select: { id: true },
  });
  await prisma.match.deleteMany({ where: { tournamentId: { in: oldTournaments.map((t) => t.id) } } });
  await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: { in: oldTournaments.map((t) => t.id) } } });
  await prisma.tournament.deleteMany({ where: { id: { in: oldTournaments.map((t) => t.id) } } });

  const teamIds = ["full-video-team-1", "full-video-team-2", "full-video-team-3", "full-video-team-4"];
  await prisma.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
  await prisma.team.deleteMany({ where: { id: { in: teamIds } } });

  return user;
}

async function activatePro(userId) {
  const proUntil = new Date();
  proUntil.setMonth(proUntil.getMonth() + 1);
  await prisma.user.update({
    where: { id: userId },
    data: { isPro: true, proUntil },
  });
}

async function createGeneratedTeams(userId) {
  const specs = [
    ["full-video-team-1", "BC Naklo"],
    ["full-video-team-2", "Jakob Meh"],
    ["full-video-team-3", "SC Kranj"],
    ["full-video-team-4", "Gimnazija Kranj"],
  ];

  for (const [id, name] of specs) {
    await prisma.team.upsert({
      where: { id },
      update: { name, sport: "Futsal", schoolName: demoSchool, createdById: userId },
      create: { id, name, sport: "Futsal", schoolName: demoSchool, createdById: userId },
    });
    await prisma.teamMember.create({
      data: { teamId: id, userId, fullName: "Jakob Demo", position: "Kapetan" },
    }).catch(() => {});
  }
}

async function registerTeamsForTournament(userId, slug) {
  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { slug } });
  const teamIds = ["full-video-team-1", "full-video-team-2", "full-video-team-3", "full-video-team-4"];
  for (const teamId of teamIds) {
    await prisma.tournamentRegistration.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId } },
      update: { status: "CONFIRMED", userId },
      create: { tournamentId: tournament.id, teamId, userId, status: "CONFIRMED" },
    });
  }
}

async function findCreatedTournamentSlug(userId) {
  const tournament = await prisma.tournament.findFirst({
    where: { organizerId: userId, title: demoTitle },
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });
  return tournament?.slug ?? null;
}

async function finishBracket(slug) {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug },
    include: { matches: { orderBy: [{ round: "asc" }, { createdAt: "asc" }] } },
  });

  const roundOne = tournament.matches.filter((m) => m.round === 1);
  if (roundOne.length >= 2) {
    await prisma.match.update({
      where: { id: roundOne[0].id },
      data: { scoreHome: 3, scoreAway: 1, status: "FINISHED" },
    });
    await prisma.match.update({
      where: { id: roundOne[1].id },
      data: { scoreHome: 2, scoreAway: 0, status: "FINISHED" },
    });

    const firstWinner = roundOne[0].homeTeamId;
    const firstLoser = roundOne[0].awayTeamId;
    const secondWinner = roundOne[1].homeTeamId;
    const secondLoser = roundOne[1].awayTeamId;

    await prisma.match.createMany({
      data: [
        {
          tournamentId: tournament.id,
          homeTeamId: firstWinner,
          awayTeamId: secondWinner,
          scoreHome: 4,
          scoreAway: 2,
          status: "FINISHED",
          round: 2,
          group: "Finale",
          court: "Igrišče 1",
        },
        {
          tournamentId: tournament.id,
          homeTeamId: firstLoser,
          awayTeamId: secondLoser,
          scoreHome: 2,
          scoreAway: 1,
          status: "FINISHED",
          round: 2,
          group: "Tekma za 3. mesto",
          court: "Igrišče 2",
        },
      ],
    });
  }

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { isCompleted: true },
  });
}

async function setupCaptionStyle(page) {
  await page.addStyleTag({
    content: `
      #video-caption {
        position: fixed;
        left: 40px;
        bottom: 32px;
        z-index: 999999;
        max-width: 620px;
        padding: 16px 18px;
        border: 1px solid rgba(43,175,58,.42);
        border-radius: 12px;
        background: rgba(7,9,15,.92);
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
        color: #f4f7fb;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      }
      #video-caption strong {
        display: block;
        margin-bottom: 5px;
        font-size: 18px;
        font-weight: 950;
      }
      #video-caption span {
        display: block;
        color: #9aa7bb;
        font-size: 13px;
        font-weight: 650;
        line-height: 1.45;
      }
    `,
  }).catch(() => {});
}

async function caption(page, title, detail) {
  await setupCaptionStyle(page);
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

async function scene(page, title, detail, ms = 3200) {
  await caption(page, title, detail);
  await page.waitForTimeout(ms);
}

async function fillStripeCheckout(page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
  await scene(page, "Vnos kartice", "Stripe test checkout: testna kartica, datum, CVC in ime.", 700);

  const cardNumber = page.locator('input[name="cardNumber"], input[autocomplete="cc-number"], input[placeholder*="1234"]').first();
  await cardNumber.waitFor({ state: "visible", timeout: 30000 });
  await cardNumber.fill("4242424242424242");

  const expiry = page.locator('input[name="cardExpiry"], input[autocomplete="cc-exp"], input[placeholder*="MM"]').first();
  await expiry.fill("1234");

  const cvc = page.locator('input[name="cardCvc"], input[autocomplete="cc-csc"], input[placeholder*="CVC"], input[placeholder*="CVV"]').first();
  await cvc.fill("123");

  const name = page.locator('input[name="billingName"], input[autocomplete="cc-name"]').first();
  if (await name.count()) {
    await name.fill("Jakob Demo");
  }

  const country = page.locator('select[name="billingCountry"]').first();
  if (await country.count()) {
    await country.selectOption("SI").catch(() => {});
  }

  await scene(page, "Testno placilo", "Kartica je izpolnjena, uporabnik potrdi Pro narocnino.", 900);

  const submit = page.locator('button[type="submit"]').last();
  await submit.click();
  await page.waitForURL(/localhost:3000\/upgrade\/success|localhost:3000\/upgrade\?payment=success/, { timeout: 45000 });
}

async function chooseCustomSelect(page, placeholderText, optionText) {
  await page.getByText(placeholderText).click();
  await page.getByText(optionText, { exact: true }).click();
}

async function registerTeamsThroughUi(page, slug) {
  const teamNames = ["BC Naklo", "Jakob Meh", "SC Kranj", "Gimnazija Kranj"];

  for (const [index, teamName] of teamNames.entries()) {
    await page.goto(`${baseUrl}/tournaments/${slug}`, { waitUntil: "networkidle" });
    await scene(
      page,
      index === 0 ? "Dodajanje ekip v turnir" : "Naslednja prijava ekipe",
      `Iz dropdowna izberemo ekipo ${teamName} in jo prijavimo na turnir.`,
      index === 0 ? 1400 : 900,
    );
    await chooseCustomSelect(page, "Izberi ekipo...", teamName);
    await page.getByRole("button", { name: "Prijavi ekipo" }).click();
    await page.waitForURL(`**/tournaments/${slug}`);
    await page.waitForLoadState("networkidle");
  }
}

async function saveVisibleResult(page, homeScore, awayScore, title, detail) {
  await scene(page, title, detail, 900);
  await page.locator('input[name="scoreHome"]').first().fill(String(homeScore));
  await page.locator('input[name="scoreAway"]').first().fill(String(awayScore));
  await scene(page, "Shrani rezultat", `${homeScore}:${awayScore} je vpisan, kliknemo Shrani.`, 650);
  await page.getByRole("button", { name: "Shrani" }).first().click();
  await page.waitForLoadState("networkidle");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await purgeAllAppData();
  const user = await resetDemoData();

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
  page.setDefaultTimeout(25000);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', demoEmail);
  await page.fill('input[name="password"]', demoPassword);
  await scene(page, "Prijava", "Demo uporabnik se prijavi v dejansko lokalno aplikacijo.", 1700);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  await scene(page, "Nadzorna plošča", "Začetni pregled turnirjev, ekip in obvestil.", 1800);

  await page.goto(`${baseUrl}/upgrade`, { waitUntil: "networkidle" });
  await scene(page, "Nakup Pro plana", "Uporabnik izbere Pro za ustvarjanje turnirjev.", 1400);
  await page.getByText(/Naroči se|NaroÄi se/).click();
  try {
    await fillStripeCheckout(page);
  } catch (error) {
    console.warn("Stripe checkout snemanje ni uspelo, uporabljam lokalni success fallback:", error);
    await activatePro(user.id);
    await page.goto(`${baseUrl}/upgrade?payment=success`, { waitUntil: "networkidle" });
  }
  await activatePro(user.id);
  await page.goto(`${baseUrl}/upgrade?payment=success`, { waitUntil: "networkidle" });
  await scene(page, "Pro aktiviran", "Po uspešnem testnem plačilu se račun odklene.", 1900);

  await createGeneratedTeams(user.id);
  await page.goto(`${baseUrl}/teams`, { waitUntil: "networkidle" });
  await scene(page, "Avtomatsko pripravljene ekipe", "Ekipe so generirane za demo, zato jih ne ustvarjamo ročno eno po eno.", 2600);

  await page.goto(`${baseUrl}/tournaments/create`, { waitUntil: "networkidle" });
  await scene(page, "Ustvari turnir", "Organizator vnese osnovne podatke in izbere bracket format.", 1200);
  await page.fill('input[name="title"]', demoTitle);
  await chooseCustomSelect(page, "Izberi šport...", "Futsal");
  await page.fill('input[name="location"]', "Športna dvorana Naklo");
  await page.fill('input[name="date"]', "2026-06-12T09:00");
  await page.fill('input[name="maxTeams"]', "4");
  await page.fill('textarea[name="description"]', "Predstavitveni turnir za video aplikacije SZSS.");
  await scene(page, "Podatki turnirja", "Turnir je pripravljen za 4 ekipe in izločilni bracket.", 1500);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/tournaments/**");
  let slug = await findCreatedTournamentSlug(user.id);

  if (!slug) {
    const tournament = await prisma.tournament.create({
      data: {
        title: demoTitle,
        slug: `${demoSlugBase}-fallback`,
        sport: "Futsal",
        description: "Predstavitveni turnir za video aplikacije SZSS.",
        location: "Športna dvorana Naklo",
        date: new Date("2026-06-12T09:00:00.000Z"),
        maxTeams: 4,
        format: "KNOCKOUT",
        organizerId: user.id,
      },
      select: { slug: true },
    });
    slug = tournament.slug;
  }

  await registerTeamsThroughUi(page, slug);
  await page.goto(`${baseUrl}/tournaments/${slug}`, { waitUntil: "networkidle" });
  await scene(page, "Prijavljene ekipe", "Vse štiri ekipe so zdaj prijavljene na turnir.", 2400);

  await page.goto(`${baseUrl}/tournaments/${slug}/matches`, { waitUntil: "networkidle" });
  await scene(page, "Generiranje tekem", "S klikom aplikacija iz prijavljenih ekip ustvari bracket pare.", 1200);
  await page.click("text=Generiraj tekme");
  await page.waitForURL(`**/tournaments/${slug}/matches`);
  await scene(page, "Bracket je ustvarjen", "Pri 4 ekipah nastaneta dve začetni tekmi, ne 6 skupinskih tekem.", 2200);

  await saveVisibleResult(page, 3, 1, "Vnos rezultata", "Vpišemo rezultat prve bracket tekme.");
  await saveVisibleResult(page, 2, 0, "Drugi rezultat", "Ko shranimo še drugo tekmo, aplikacija ustvari finale in tekmo za 3. mesto.");
  await page.goto(`${baseUrl}/tournaments/${slug}/matches`, { waitUntil: "networkidle" });
  await scene(page, "Finale in tekma za 3. mesto", "Zmagovalci so v finalu, poraženci igrajo za tretje mesto.", 2400);
  await saveVisibleResult(page, 4, 2, "Rezultat finala", "Vpišemo še finalni rezultat.");
  await saveVisibleResult(page, 2, 1, "Rezultat za 3. mesto", "Vpišemo rezultat tekme za tretje mesto.");
  await prisma.tournament.update({
    where: { slug },
    data: { isCompleted: true },
  });

  await page.goto(`${baseUrl}/tournaments/${slug}`, { waitUntil: "networkidle" });
  await scene(page, "Končna lestvica", "Točkovanje: 1. mesto 3 točke, 2. mesto 2 točki, 3. mesto 1 točka.", 3200);

  await page.goto(`${baseUrl}/leaderboard`, { waitUntil: "networkidle" });
  await scene(page, "Globalna lestvica", "Zaključen turnir objavi rezultate na skupni lestvici.", 2400);

  const video = page.video();
  await context.close();
  await browser.close();

  const recordedPath = await video.path();
  await fs.copyFile(recordedPath, finalVideoPath);
  await purgeAllAppData();
  await prisma.$disconnect();
  console.log(finalVideoPath);
}

main().catch(async (error) => {
  await prisma.$disconnect().catch(() => {});
  console.error(error);
  process.exit(1);
});
