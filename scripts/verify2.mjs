import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";

const URL = "http://localhost:4321";
const OUT = "shots2";

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // wait for loader gone
  for (let i = 0; i < 100; i++) {
    const present = await page.evaluate(() => !!document.querySelector(".loader-fade"));
    if (!present) break;
    await new Promise((r) => setTimeout(r, 30));
  }

  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/01-hint-onload.png` });

  const hintInfo = await page.evaluate(() => {
    const hint = document.querySelector(".onboard-hint");
    const ring = document.querySelector(".planet-hint-ring");
    return {
      hintActive: hint?.classList.contains("is-active"),
      hintText: hint?.textContent,
      hintFontSize: hint ? getComputedStyle(hint).fontSize : null,
      ringPresent: !!ring,
      ringSize: ring ? getComputedStyle(ring).width : null,
    };
  });
  console.log("Hint info at load:", hintInfo);

  // wait 6s to see intensify state kick in
  await new Promise((r) => setTimeout(r, 6000));
  await page.screenshot({ path: `${OUT}/02-hint-intensified.png` });
  const intenseInfo = await page.evaluate(() => {
    const hint = document.querySelector(".onboard-hint");
    return { isIntense: hint?.classList.contains("is-intense") };
  });
  console.log("Hint intense after 6s idle:", intenseInfo);

  // now click a planet — hint should fully disappear
  await page.click(".hero__dock-chip:nth-child(1)");
  await new Promise((r) => setTimeout(r, 600));
  const afterClick = await page.evaluate(() => {
    const hint = document.querySelector(".onboard-hint");
    return { active: hint?.classList.contains("is-active") };
  });
  console.log("Hint after click:", afterClick);
  await page.click(".card__close");
  await new Promise((r) => setTimeout(r, 800));

  // about section spacing check
  await page.evaluate(() => document.getElementById("about-section").scrollIntoView());
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/03-about.png` });
  const aboutHtml = await page.evaluate(() => {
    const sec = document.querySelector(".about-section__inner");
    return {
      hasStats: !!document.querySelector(".stats-strip"),
      childTags: Array.from(sec.children).map((c) => c.className),
    };
  });
  console.log("About section check:", aboutHtml);

  await browser.close();
}

main();
