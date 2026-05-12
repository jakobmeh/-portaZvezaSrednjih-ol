import { chromium } from "@playwright/test";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:3000";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function serverUp() {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    return r.status < 500;
  } catch { return false; }
}

async function waitServer(ms = 90_000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await serverUp()) return;
    await sleep(1200);
  }
  throw new Error("Server se ni zagnal v 90s.");
}

async function slowType(page, locator, text, delay = 58) {
  await locator.click();
  for (const ch of text) { await page.keyboard.type(ch); await sleep(delay); }
}

async function smoothScroll(page, dy, steps = 8) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(v => window.scrollBy(0, v), Math.round(dy / steps));
    await sleep(90);
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
let devServer = null;

async function main() {
  // 1. Start dev server if not running
  if (!(await serverUp())) {
    console.log("🚀  Zaganjam Next.js dev server...");
    devServer = spawn(
      process.platform === "win32" ? "cmd" : "sh",
      process.platform === "win32" ? ["/c", "npx next dev"] : ["-c", "npx next dev"],
      { cwd: __dirname, stdio: ["ignore", "pipe", "pipe"] }
    );
    devServer.stdout.on("data", d => process.stdout.write(d));
    devServer.stderr.on("data", d => process.stderr.write(d));
    console.log("⏳  Čakam na server (max 90s)...");
    await waitServer();
    await sleep(2000); // extra buffer za hydration
  } else {
    console.log("✓  Server že teče na", BASE);
  }

  // 2. Pripravi output dir
  const videoDir = path.join(__dirname, "video-output");
  await mkdir(videoDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--window-size=1280,800"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  ctx.setDefaultTimeout(15_000);
  const p = await ctx.newPage();

  console.log("\n🎬  Snemanje se začne...\n");

  try {

    // ────────────────────────────────────────────────────────────────
    // SCENA 1 – LANDING PAGE
    // ────────────────────────────────────────────────────────────────
    console.log("  [1/9] Landing page");
    await p.goto(BASE, { waitUntil: "networkidle" });
    await sleep(2500);
    await smoothScroll(p, 550);
    await sleep(2200);
    await smoothScroll(p, -550);
    await sleep(1200);

    // Klik Prijava v navu
    await p.click("a[href='/login']");
    await p.waitForURL("**/login", { waitUntil: "networkidle" });

    // ────────────────────────────────────────────────────────────────
    // SCENA 2 – LOGIN
    // ────────────────────────────────────────────────────────────────
    console.log("  [2/9] Login");
    await sleep(1000);
    await slowType(p, p.locator("input[name='email']"), "jakobmehmc1@gmail.com", 52);
    await sleep(350);
    await slowType(p, p.locator("input[name='password']"), "test1234", 85);
    await sleep(700);
    await p.click("button[type='submit']");
    await p.waitForURL("**/dashboard", { waitUntil: "networkidle", timeout: 20_000 });

    // ────────────────────────────────────────────────────────────────
    // SCENA 3 – DASHBOARD
    // ────────────────────────────────────────────────────────────────
    console.log("  [3/9] Dashboard");
    await sleep(2800);
    // Počasi pomakni navzdol da se vidi vse
    await smoothScroll(p, 320);
    await sleep(1800);
    await smoothScroll(p, -320);
    await sleep(1200);

    // ────────────────────────────────────────────────────────────────
    // SCENA 4 – EKIPE + ROČNI VNOS
    // ────────────────────────────────────────────────────────────────
    console.log("  [4/9] Ekipe – ročni vnos");
    await p.click("a[href='/teams']");
    await p.waitForURL("**/teams", { waitUntil: "networkidle" });
    await sleep(1500);
    await smoothScroll(p, 250);
    await sleep(1000);

    // Ročni vnos – najdi prvi input[name="fullName"]
    const fnInput = p.locator("input[name='fullName']").first();
    if (await fnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fnInput.scrollIntoViewIfNeeded();
      await sleep(500);
      await slowType(p, fnInput, "Janez Kranjski", 60);
      const clInput = p.locator("input[name='className']").first();
      if (await clInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slowType(p, clInput, "3.B", 90);
      }
      const posInput = p.locator("input[name='position']").first();
      if (await posInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slowType(p, posInput, "Napadalec", 60);
      }
      await sleep(1800);
      // Submit ročni vnos
      const addBtn = p.locator("button:has-text('Dodaj ročno')").first();
      if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addBtn.click();
        await p.waitForURL("**/teams", { waitUntil: "networkidle", timeout: 10_000 });
        await sleep(2000);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // SCENA 5 – USTVARI TURNIR
    // ────────────────────────────────────────────────────────────────
    console.log("  [5/9] Ustvari turnir");
    await p.goto(`${BASE}/tournaments/create`, { waitUntil: "networkidle" });
    await sleep(1200);

    await slowType(p, p.locator("input[name='title']"), "Zimski pokal v futsalu 2026", 50);
    await sleep(300);

    // Sport – custom SchoolSelect
    const sportTrigger = p.locator("button.field").first();
    if (await sportTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sportTrigger.click();
      await sleep(400);
      const searchBox = p.locator("input[placeholder='Išči šolo...']").first();
      if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slowType(p, searchBox, "Futsal", 75);
        await sleep(400);
        await p.locator("button:has-text('Futsal')").first().click();
      }
    }
    await sleep(300);

    await slowType(p, p.locator("input[name='location']"), "Športna dvorana Velenje", 50);
    await sleep(300);
    await p.fill("input[name='date']", "2026-06-20T10:00");
    await sleep(300);
    await slowType(p, p.locator("textarea[name='description']"), "Turnir za srednje šole Šaleške doline.", 28);
    await sleep(500);
    // Samoregistracija
    const selfReg = p.locator("input[name='selfRegistrationEnabled']");
    if (await selfReg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selfReg.check();
      await sleep(600);
    }
    // Scroll da se vidi submit
    await smoothScroll(p, 200);
    await sleep(1800);

    // ────────────────────────────────────────────────────────────────
    // SCENA 6 – SEZNAM TURNIRJEV
    // ────────────────────────────────────────────────────────────────
    console.log("  [6/9] Turnirji");
    await p.goto(`${BASE}/tournaments`, { waitUntil: "networkidle" });
    await sleep(2200);

    // Klik na prvi turnir
    const firstTournament = p.locator("a[href^='/tournaments/']").first();
    if (await firstTournament.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTournament.click();
      await p.waitForLoadState("networkidle");
      await sleep(2500);
      await smoothScroll(p, 400);
      await sleep(1800);
      await smoothScroll(p, -200);
      await sleep(1000);
    }

    // ────────────────────────────────────────────────────────────────
    // SCENA 7 – NOTIFICATIONS
    // ────────────────────────────────────────────────────────────────
    console.log("  [7/9] Obvestila");
    await p.goto(`${BASE}/notifications`, { waitUntil: "networkidle" });
    await sleep(2200);

    // ────────────────────────────────────────────────────────────────
    // SCENA 8 – LESTVICA
    // ────────────────────────────────────────────────────────────────
    console.log("  [8/9] Lestvica");
    await p.goto(`${BASE}/leaderboard`, { waitUntil: "networkidle" });
    await sleep(2800);

    // ────────────────────────────────────────────────────────────────
    // SCENA 9 – ADMIN PANEL
    // ────────────────────────────────────────────────────────────────
    console.log("  [9/9] Admin panel");
    await p.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await sleep(2000);
    await smoothScroll(p, 300);
    await sleep(1500);

    // Klikni SchoolSelect v licencah
    const licTrigger = p.locator("button.field").last();
    if (await licTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await licTrigger.click();
      await sleep(400);
      const adminSearch = p.locator("input[placeholder='Išči šolo...']").last();
      if (await adminSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slowType(p, adminSearch, "Velenje", 75);
        await sleep(500);
        const velOpt = p.locator("button:has-text('Velenje')").first();
        if (await velOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await velOpt.click();
          await sleep(1500);
        }
      }
    }
    await sleep(2000);

  } finally {
    console.log("\n💾  Shranjujem video...");
    const videoPath = await p.video()?.path();
    await ctx.close();
    await browser.close();
    if (devServer) { devServer.kill(); console.log("   Dev server ustavljen."); }

    // Preimenuj video
    if (videoPath && existsSync(videoPath)) {
      const dest = path.join(videoDir, "szss-demo.webm");
      const { rename } = await import("fs/promises");
      await rename(videoPath, dest).catch(() => {});
      console.log(`\n✅  Video shranjen: ${dest}`);
    } else {
      console.log(`\n✅  Video shranjen v: ${videoDir}`);
    }
  }
}

main().catch(e => { console.error(e); if (devServer) devServer.kill(); process.exit(1); });
