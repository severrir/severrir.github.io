import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";

const URL = "http://localhost:4321";
const OUT = "shots";

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
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const navDoneAt = Date.now();

  // poll from outside the page so we capture the full window, including
  // however long it took the bundle itself to parse/mount React.
  let loaderGoneAt = null;
  for (let i = 0; i < 100; i++) {
    const present = await page.evaluate(() => !!document.querySelector(".loader-fade"));
    if (!present) {
      loaderGoneAt = Date.now();
      break;
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  console.log(
    "LOADER total visible time from nav (ms):",
    loaderGoneAt ? loaderGoneAt - navDoneAt : "still visible after 3s"
  );

  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/01-hero.png` });

  // dock chip orb colors — confirm bug #1 fix (should not be blank/transparent)
  const orbColors = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".hero__dock-orb")).map(
      (el) => getComputedStyle(el).backgroundColor
    )
  );
  console.log("Dock orb colors:", orbColors);

  // onboarding hint present right after reveal
  const hintVisible = await page.evaluate(() => {
    const el = document.querySelector(".onboard-hint");
    return el ? el.classList.contains("is-active") : false;
  });
  console.log("Onboarding hint active after reveal:", hintVisible);

  await page.screenshot({ path: `${OUT}/02-hint.png` });

  // click through several planets in a row to stress-test the camera rig
  for (let i = 0; i < 3; i++) {
    await page.click(`.hero__dock-chip:nth-child(${i + 1})`);
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/03-focus-${i}.png` });
  }

  // hint should now be dismissed (interaction happened)
  const hintAfterClick = await page.evaluate(() =>
    document.querySelector(".onboard-hint")?.classList.contains("is-active")
  );
  console.log("Onboarding hint active after clicking planets:", hintAfterClick);

  // close and confirm smooth return
  await page.click(".card__close");
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `${OUT}/04-returned.png` });

  // scroll to about + contact sections
  await page.evaluate(() => document.getElementById("about-section").scrollIntoView());
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/05-about.png` });

  const stats = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".stats-strip__item")).map(
      (el) => el.textContent
    )
  );
  console.log("Stats strip:", stats);

  await page.evaluate(() => document.getElementById("contact-section").scrollIntoView());
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/06-contact.png` });

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => ({
      text: a.textContent.trim().slice(0, 30),
      href: a.href,
      target: a.target,
    }))
  );
  console.log("All links:\n" + JSON.stringify(links, null, 2));

  console.log("Console/page errors:", errors);
  console.log("Total script time (ms):", Date.now() - t0);

  await browser.close();
}

main();
