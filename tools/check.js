#!/usr/bin/env node
/* Page checker for the Linear Theory guide.
   Usage: node tools/check.js page.html [more.html ...] [--shots] [--dark] [--mobile] [--out DIR] [--full]
   - Serves MathJax from tools/node_modules (the CDN is not reachable from this machine), stubs Google Fonts.
   - Reports: console and page errors, MathJax TeX errors, leftover $ delimiters, unresolved cross-references,
     horizontal overflow (desktop and phone widths), plots without coloured marks, abbreviations not spelled out
     at first use, em dashes in the source, and counts of sections, blocks, visuals and self-check items.
   - --shots writes a PNG of the page header and of every .viz figure (light; --dark adds dark-mode copies). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, 'shots');
const files = args.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1));
const ROOT = path.resolve(__dirname, '..');
const MJ = path.join(__dirname, 'node_modules', 'mathjax');
const MJ_PREFIX = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/';

function glossary() {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'toc.js'), 'utf8');
  const sandbox = {}; new Function('window', src)(sandbox);
  return sandbox.LT_GLOSSARY || [];
}

async function route(context) {
  await context.route('**/*', async r => {
    const url = r.request().url();
    if (url.startsWith('file:')) return r.continue();
    if (url.startsWith(MJ_PREFIX)) {
      const p = path.join(MJ, url.slice(MJ_PREFIX.length).split('?')[0]);
      if (fs.existsSync(p)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(p) });
      return r.fulfill({ status: 404, body: '' });
    }
    if (url.includes('fonts.googleapis.com')) return r.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (url.includes('fonts.gstatic.com')) return r.fulfill({ status: 404, body: '' });
    return r.abort();
  });
}

async function checkPage(browser, file, gl) {
  const abs = path.resolve(file);
  const name = path.basename(abs, '.html');
  const html = fs.readFileSync(abs, 'utf8');
  const report = { page: path.relative(ROOT, abs), errors: [], warnings: [] };
  const emCount = (html.match(/—|&mdash;|&#8212;|\\u2014/g) || []).length;
  if (emCount) report.errors.push(`em dash appears ${emCount} time(s) in the source`);

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' });
  await route(context);
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') report.errors.push('console: ' + m.text()); });
  page.on('pageerror', e => report.errors.push('pageerror: ' + e.message));
  await page.goto('file://' + abs, { waitUntil: 'load' });
  const hasMJ = /mathjax@3\.2\.2/.test(html);
  if (hasMJ) {
    try { await page.waitForFunction(() => window.__LT_MATH_DONE === true, null, { timeout: 60000 }); }
    catch (e) { report.errors.push('MathJax did not finish typesetting within 60 s'); }
  }
  await page.waitForTimeout(900);
  const res = await page.evaluate(gl => {
    const out = {};
    out.mathErrors = Array.from(document.querySelectorAll('[data-mjx-error]')).map(e => e.getAttribute('data-mjx-error'));
    const main = document.querySelector('main') || document.body;
    const clone = main.cloneNode(true);
    clone.querySelectorAll('h1, .ch-title, script, style, mjx-container, .prevnext').forEach(e => e.remove());
    clone.querySelectorAll('*').forEach(e => e.appendChild(document.createTextNode(' ')));
    const text = (clone.textContent || '').replace(/[ \t]+/g, ' ');
    out.dollars = (text.match(/\$/g) || []).length;
    out.rawTex = (text.match(/\\(frac|begin|mathbb|lambda|sigma|alpha|left|right)\b/g) || []).slice(0, 5);
    out.xrefMissing = Array.from(document.querySelectorAll('a.xref')).filter(a => a.textContent.startsWith('??')).map(a => a.getAttribute('href'));
    out.overflow = document.documentElement.scrollWidth > window.innerWidth + 1 ? document.documentElement.scrollWidth : 0;
    // Structure of numbered statements: unique ids, a run-in label on every block, and a proof or source after
    // every Theorem, Proposition, Lemma and Corollary (SPEC §2 rule 11, §4.1).
    const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
    out.dupIds = Object.keys(ids).filter(k => ids[k] > 1);
    out.unlabeled = Array.from(main.querySelectorAll('.blk')).filter(b => !b.querySelector('.blk-label')).map(b => b.id || b.className);
    out.unproved = Array.from(main.querySelectorAll('.blk.thm, .blk.prop, .blk.lem, .blk.cor')).filter(b => {
      if (b.querySelector('.proof, .src')) return false;
      let nx = b.nextElementSibling;
      while (nx && nx.matches('dl.where')) nx = nx.nextElementSibling;   // a symbol list may sit between
      return !(nx && (nx.classList.contains('proof') || nx.classList.contains('src')));
    }).map(b => {
      let nx = b.nextElementSibling; while (nx && nx.matches('dl.where')) nx = nx.nextElementSibling;
      return '#' + (b.id || '(no id)') + ' (next: ' + (nx ? nx.tagName.toLowerCase() + '.' + Array.from(nx.classList).join('.') : 'none') + ')';
    });
    const norm = s => s.toLowerCase().replace(/[‐-―\-]/g, '-').replace(/\s+/g, ' ');
    // Search and slice the same normalized string, so the window sits exactly around the match.
    const base = text.replace(/[‐-―\-]/g, '-').replace(/\s+/g, ' ');
    const lower = base.toLowerCase();
    out.abbr = [];
    gl.forEach(([ab, exp]) => {
      const esc = ab.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
      const re = new RegExp('(?<![A-Za-z0-9])' + esc + 's?(?![A-Za-z0-9])');
      const m = re.exec(base); if (!m) return;
      const win = lower.slice(Math.max(0, m.index - 220), m.index + ab.length + 220);
      if (!win.includes(norm(exp))) out.abbr.push(`${ab} (${exp}) first used without expansion: "...${base.slice(Math.max(0, m.index - 60), m.index + 40)}..."`);
    });
    const cv = Array.from(main.querySelectorAll('canvas'));
    out.canvases = cv.map((c, i) => {
      try {
        const ctx = c.getContext('2d'); const w = c.width, h = c.height; if (!w || !h) return { i, blank: true, colored: 0 };
        const d = ctx.getImageData(0, 0, w, h).data; let colored = 0, total = 0;
        for (let k = 0; k < d.length; k += 4 * 7) { total++; const mx = Math.max(d[k], d[k + 1], d[k + 2]), mn = Math.min(d[k], d[k + 1], d[k + 2]); if (mx - mn > 60) colored++; }
        return { i, colored, frac: +(colored / total).toFixed(4), w: c.clientWidth, h: c.clientHeight };
      } catch (e) { return { i, error: String(e) }; }
    });
    out.counts = {
      sections: main.querySelectorAll('section.sec').length,
      visuals: main.querySelectorAll('.viz').length,
      defs: main.querySelectorAll('.blk.def').length,
      theorems: main.querySelectorAll('.blk.thm, .blk.prop, .blk.lem, .blk.cor').length,
      proofs: main.querySelectorAll('.proof').length,
      examples: main.querySelectorAll('.blk.ex').length,
      counterexamples: main.querySelectorAll('.blk.cex').length,
      probes: main.querySelectorAll('.blk.probe').length,
      patterns: main.querySelectorAll('.blk.pattern').length,
      selfcheck: main.querySelectorAll('.selfcheck li').length,
      refs: main.querySelectorAll('.refs li').length,
      words: (text.match(/\S+/g) || []).length
    };
    return out;
  }, gl);
  if (res.mathErrors.length) report.errors.push('TeX errors: ' + res.mathErrors.join(' | '));
  if (res.dollars) report.errors.push(`${res.dollars} literal $ left in the text (unbalanced math delimiters?)`);
  if (res.rawTex.length) report.warnings.push('raw TeX visible in text: ' + res.rawTex.join(', '));
  if (res.xrefMissing.length) report.errors.push('unresolved cross-references: ' + res.xrefMissing.join(', '));
  if (res.overflow) report.errors.push(`horizontal overflow at 1280 px: scrollWidth ${res.overflow}`);
  if (res.dupIds.length) report.errors.push('duplicate ids: ' + res.dupIds.join(', '));
  if (res.unlabeled.length) report.errors.push('blocks without a run-in label (first child must be a <p> or list): ' + res.unlabeled.join(', '));
  if (res.unproved.length) report.warnings.push('numbered statements not followed by a .proof or p.src: ' + res.unproved.join('; '));
  res.abbr.forEach(a => report.warnings.push(a));
  res.canvases.forEach(c => { if (c.error) report.errors.push(`canvas ${c.i}: ${c.error}`); else if (!c.colored) report.warnings.push(`canvas ${c.i} has no coloured marks (blank plot?)`); });
  report.counts = res.counts;

  if (flags.has('--shots')) {
    fs.mkdirSync(outDir, { recursive: true });
    const head = await page.$('.ch-head, .hub-hero');
    if (head) await head.screenshot({ path: path.join(outDir, `${name}_head.png`) });
    const vizzes = await page.$$('.viz');
    for (let k = 0; k < vizzes.length; k++) { await vizzes[k].scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await vizzes[k].screenshot({ path: path.join(outDir, `${name}_viz${k + 1}.png`) }); }
    if (flags.has('--full')) await page.screenshot({ path: path.join(outDir, `${name}_full.png`), fullPage: true });
    report.shots = path.relative(ROOT, outDir);
  }
  await context.close();

  // phone width
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: 'light', isMobile: true, hasTouch: true });
  await route(mctx);
  const mp = await mctx.newPage();
  mp.on('pageerror', e => report.errors.push('mobile pageerror: ' + e.message));
  await mp.goto('file://' + abs, { waitUntil: 'load' });
  if (hasMJ) { try { await mp.waitForFunction(() => window.__LT_MATH_DONE === true, null, { timeout: 60000 }); } catch (e) { /* reported above */ } }
  await mp.waitForTimeout(500);
  const mo = await mp.evaluate(() => {
    const wide = [];
    const W = document.documentElement.clientWidth;
    document.querySelectorAll('main *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > W + 2 && getComputedStyle(e).position !== 'fixed') { const ov = e.closest('.tbl-wrap, mjx-container, .readout, pre'); if (!ov) wide.push((e.className && typeof e.className === 'string' ? e.tagName + '.' + e.className.split(' ')[0] : e.tagName) + ':' + Math.round(r.right)); } });
    return { scroll: document.documentElement.scrollWidth, W, wide: wide.slice(0, 8) };
  });
  if (mo.scroll > mo.W + 1) report.errors.push(`horizontal overflow at 390 px: scrollWidth ${mo.scroll}; widest: ${mo.wide.join(', ')}`);
  if (flags.has('--mobile') && flags.has('--shots')) { const v = await mp.$('.viz'); if (v) { await v.scrollIntoViewIfNeeded(); await v.screenshot({ path: path.join(outDir, `${name}_mobile_viz1.png`) }); } }
  await mctx.close();

  if (flags.has('--dark') && flags.has('--shots')) {
    const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark' });
    await route(dctx);
    const dp = await dctx.newPage();
    await dp.goto('file://' + abs, { waitUntil: 'load' });
    if (hasMJ) { try { await dp.waitForFunction(() => window.__LT_MATH_DONE === true, null, { timeout: 60000 }); } catch (e) { /* reported above */ } }
    await dp.waitForTimeout(700);
    const vz = await dp.$$('.viz');
    for (let k = 0; k < vz.length; k++) { await vz[k].scrollIntoViewIfNeeded(); await dp.waitForTimeout(120); await vz[k].screenshot({ path: path.join(outDir, `${name}_viz${k + 1}_dark.png`) }); }
    const head = await dp.$('.ch-head, .hub-hero'); if (head) await head.screenshot({ path: path.join(outDir, `${name}_head_dark.png`) });
    await dctx.close();
  }
  return report;
}

(async () => {
  if (!files.length) { console.log('usage: node tools/check.js page.html [...] [--shots] [--dark] [--mobile] [--out DIR] [--full]'); process.exit(2); }
  const gl = glossary();
  const browser = await chromium.launch();
  let bad = 0;
  for (const f of files) {
    const r = await checkPage(browser, f, gl);
    if (r.errors.length) bad++;
    console.log(JSON.stringify(r, null, 1));
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
