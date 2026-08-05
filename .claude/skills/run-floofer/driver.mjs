#!/usr/bin/env node
/* Headless-Chromium REPL for driving the Floofer dev server.
 * Agent tooling, not product code — commands come in on stdin, one per
 * line, so it works piped (heredoc) or interactively under tmux.
 *
 *   node .claude/skills/run-floofer/driver.mjs <<'EOF'
 *   nav http://localhost:3000
 *   wait text=Duke
 *   ss deck
 *   EOF
 *
 * Uses the container's pre-installed Chromium (PLAYWRIGHT_BROWSERS_PATH
 * is set globally); falls back to /opt/pw-browsers/chromium if the
 * playwright-core revision doesn't match the bundled one.
 */
import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";
import readline from "node:readline";

const SHOTS = "/tmp/floofer-shots";
mkdirSync(SHOTS, { recursive: true });

const launchOpts = { args: ["--no-sandbox", "--disable-gpu"] };
let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch {
  // Revision mismatch with the preinstalled set — use the stable symlink.
  const exe = "/opt/pw-browsers/chromium";
  if (!existsSync(exe)) throw new Error("No usable Chromium found");
  browser = await chromium.launch({ ...launchOpts, executablePath: exe });
}

const page = await (await browser.newContext({ viewport: { width: 420, height: 850 } })).newPage();

/* Floofer is mobile-first (bottom tab bar, swipe deck) — the 420×850
   viewport above is deliberate; a desktop viewport renders fine but
   screenshots stop looking like what users see. */

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const ok = (msg) => console.log(`ok ${msg}`);
let shot = 0;

async function run(line) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const arg = rest.join(" ");
  if (!cmd || cmd.startsWith("#")) return;
  switch (cmd) {
    case "nav":
      await page.goto(arg, { waitUntil: "domcontentloaded" });
      ok(`nav ${arg}`);
      break;
    case "wait": // any Playwright selector, incl. text=…
      await page.waitForSelector(arg, { timeout: 20000 });
      ok(`wait ${arg}`);
      break;
    case "click":
      await page.click(arg, { timeout: 10000 });
      ok(`click ${arg}`);
      break;
    case "fill": {
      const [sel, ...val] = arg.split("|"); // fill <selector>|<value>
      await page.fill(sel.trim(), val.join("|").trim());
      ok(`fill ${sel.trim()}`);
      break;
    }
    case "press":
      await page.keyboard.press(arg);
      ok(`press ${arg}`);
      break;
    case "ss": {
      const name = arg || `shot-${++shot}`;
      const path = `${SHOTS}/${name}.png`;
      await page.screenshot({ path, fullPage: false });
      ok(`ss ${path}`);
      break;
    }
    case "eval":
      console.log(JSON.stringify(await page.evaluate(arg)));
      break;
    case "waitfn": // wait until a JS expression is truthy in the page
      await page.waitForFunction(arg, undefined, { timeout: 20000 });
      ok(`waitfn ${arg}`);
      break;
    case "errors":
      console.log(consoleErrors.length ? consoleErrors.join("\n") : "no console errors");
      break;
    case "quit":
      await browser.close();
      process.exit(0);
    default:
      console.log(`?? unknown command: ${cmd}`);
  }
}

const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  try {
    await run(line);
  } catch (e) {
    console.log(`ERR ${line.trim()} -> ${e.message?.split("\n")[0]}`);
  }
}
await browser.close();
