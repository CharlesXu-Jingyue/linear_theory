# Authoring spec: Linear Theory interactive study guide

This file is the brief for writing chapter pages. Read it fully, then read `ch01_linear_maps.html` (the finished
exemplar chapter: copy its structure, tone, markup and widget style exactly) and skim `assets/lt.js` (the shared
runtime) before writing anything.

## 1. Reader and purpose

The reader is Charles, a 4th-year Ph.D. candidate in computational and theoretical neuroscience (Caltech, Computation
and Neural Systems; co-advised in control theory). He studies the control and dynamics of neural population activity,
is fluent in mathematics and physics, prefers mechanistic, rigorous, structured explanations, and is preparing for
qualifying exams. This is a personal study guide: a fast refresher of linear algebra, then linear analysis and linear
systems theory for control and dynamics. Visual intuition is a central component, not decoration.

Write like a good modern textbook (Axler, Hespanha, Trefethen and Embree, Åström and Murray): precise statements,
short clean derivations, honest pointers to open sources when a proof is long. Do not pad. Do not write in a chatty
voice. No emoji.

## 2. Hard rules (from the user; every page must satisfy them)

1. **Every symbol and value is explained where it first appears on the page**: inline ("where $Q \succeq 0$ is the
   state weight") or in a `where` list right under a displayed equation (see §4). This applies per page: a reader may
   open chapter 9 first. Recurrent global symbols ($\R$, $A^\T$, $\Lambda(A)$, ...) still get a one-phrase gloss at
   first use on each page and must appear in the chapter's "Notation introduced in this chapter" table if new.
2. **Abbreviations are spelled out at first use on each page**, in the form "linear quadratic regulator (LQR)". The
   checker enforces this for the glossary in `assets/toc.js` (`LT_GLOSSARY`); add new abbreviations there only by
   reporting them (do not edit shared files, see §8). The chapter title (h1) is exempt, but the lead paragraph is not.
3. **No em dashes anywhere** (not in prose, not in JS strings, not as `&mdash;`). Use commas, colons, semicolons,
   parentheses or separate sentences. En dashes are fine in name pairs and ranges: Courant–Fischer, pages 12–19.
4. **Math in LaTeX** (MathJax): `$...$` inline, `$$...$$` display inside `<div class="eq">`. Logically mathematical
   symbols in prose go in math mode: write `$\lambda$`, `$\to$`, `$\approx 0.5$`, not bare Unicode λ, →, ≈.
   Exceptions: canvas labels and live readouts (plain HTML, see §6), and inline SVG diagrams.
5. **Derivations simple and clean.** When a proof is long or technical, state the theorem precisely, give the idea in
   two or three sentences, and cite an open source with chapter and section (`<p class="src">`). Never fake a proof.
6. **Textbook-style mathematics**: numbered Definitions, Theorems, Propositions, Lemmas, Corollaries, Examples and
   Counterexamples, with proofs. Hypotheses stated explicitly.
7. **The inquiry loop**: each core topic roughly follows *problem → setting and assumptions → goal → probe (simple and
   extreme cases) → counterexample → pattern (invariants, symmetry, equivalences) → conjecture → theorem → proof →
   visual or toy example*. Use the stages that help; do not force all of them on every topic. Every chapter must have
   several probes, at least two counterexamples, and patterns that name invariants or equivalences.
8. **Visuals with guidance**: every interactive figure has a "Try this" list (2–4 concrete actions with the expected
   observation) and a "What to notice" paragraph tying the picture to a theorem in the text.
9. **Accuracy over flourish.** Figures are computed from the actual mathematics. Do not recreate figures from papers
   by hand; build the model, compute it, and cite the paper in text. If a quantitative claim is uncertain, leave it out
   or cite it.
10. Use the imaginary unit $i$ (not $j$); frequency response is $G(i\omega)$. Mention once per page where it first
    matters that engineering texts write $j$.
11. **Every proposition is explicit and numbered.** Each general mathematical claim the page asserts is the statement
    of a numbered Theorem, Proposition, Lemma or Corollary block (or of a Counterexample block, for "this fails"),
    followed by a proof, a proof sketch or a precise source. Claims must not hide in running prose, probes, patterns,
    remarks, proofs, figure notes or tables. See §4.1 for what counts and how to promote a claim.

## 3. Files, template and structure

- Pages live in `/home/claude/linear_theory/` (flat). File names are fixed in `assets/toc.js`; do not rename.
- Copy the `<head>` and shell from `ch01_linear_maps.html` verbatim, changing only `<title>` (e.g. `5 Hilbert space ·
  Linear Theory`), the topbar text, and `data-chapter` on `<main>`.
- Page skeleton, in order:
  1. `<header class="ch-head">`: eyebrow (`Part II · Linear analysis · Chapter 5`), `h1.ch-title`, `p.ch-lead` (2–3
     sentences: what the chapter is about and why it matters), `p.ch-meta` (Prerequisites, Leads to, Visuals count),
     `ol.core-q` (3 core questions), `details.notation` (table of symbols introduced in the chapter).
  2. 6 to 8 `section.sec` with an `id` and an `h2` (section numbers are added automatically; do not type them).
  3. `section.selfcheck` with 5 questions (6 in chapters 8 and 12), each with `<details><summary>Answer</summary>...</details>`.
  4. `section.refs` "Sources and further reading": specific chapters or sections; mark free copies with
     `<span class="free">Free</span>` or `Open access`. Use only references you are sure exist (see §9).
  5. `<script>LT.page.init();</script>` then one `<script>` with all widgets of the page, each in its own IIFE.
- Target length: 3,000–5,500 words of prose per chapter (chapters 8 and 12 may run longer with their multivariable
  sections), 3 visuals (2 minimum, 4 maximum; 5 for chapters 8 and 12), 1 static SVG diagram when
  a structure (block diagram, decomposition) is clearer drawn than told.

## 4. Markup vocabulary

Numbered blocks (auto-numbered per chapter, one shared counter, label inserted automatically):

```html
<div class="blk def" id="def-xxx" data-name="Short name"><p>...</p></div>       <!-- Definition k.n -->
<div class="blk thm" id="thm-xxx" data-name="Name"><p>...</p></div>              <!-- Theorem -->
<div class="blk prop|lem|cor" id="..."><p>...</p></div>                          <!-- Proposition, Lemma, Corollary -->
<div class="blk ex" id="ex-xxx" data-name="..."><p>...</p></div>                 <!-- Example -->
<div class="blk cex" id="cex-xxx"><p>...</p></div>                              <!-- Counterexample -->
```

Unnumbered inquiry-loop blocks (run-in label only): `prob` (Problem), `setting` (Setting and assumptions), `goal`,
`probe`, `pattern`, `conj` (Conjecture), `rem` (Remark), `deduce`, `why` (Why it matters).

The label is inserted into the block's first `<p>` (or first list item), so every block must start with a `<p>`.

Proofs follow their statement:

```html
<div class="proof"><p><span class="proof-label">Proof.</span> ... </p></div>
<details class="proof"><summary>Proof sketch</summary><p>...</p></details>      <!-- collapsible for long ones -->
<p class="src">Full proof: Trefethen and Embree, <i>Spectra and Pseudospectra</i>, Thm 2.1.</p>
```

Displayed equations and their symbol lists:

```html
<div class="eq">$$\dot x = Ax + Bu,\qquad y = Cx + Du.$$</div>
<dl class="where">
  <dt>$x(t) \in \R^n$</dt><dd>the state at time $t$</dd>
  <dt>$u(t) \in \R^m$</dt><dd>the input</dd>
</dl>
```

Cross-references: `<a class="xref" href="#thm-rank-nullity"></a>` is filled with "Theorem 1.10" automatically (works
for blocks, `section.sec` ids, and `.viz` ids on the same page). Never type a number for an item on the same page.
For other chapters, link by page and describe in words: `<a href="ch03_eigenvalues.html#thm-jordan">the Jordan form
theorem</a> (chapter 3)`. Ids in other chapters are not guaranteed, so prefer `<a href="ch03_eigenvalues.html">chapter
3</a>`.

Tables: `<div class="tbl-wrap"><table class="tbl">...</table></div>`. Use tables for taxonomies and comparisons (the
user likes "clear taxonomy breakdowns"); every chapter should have at least one taxonomy table.

Static diagrams: inline `<svg>` inside `<figure class="wide">`, colours only from CSS variables
(`var(--ink)`, `var(--ink-2)`, `var(--muted)`, `var(--c1)`...`var(--c8)`, `var(--tint-def)`, `var(--rule-strong)`),
fonts `var(--font-body)` / `var(--font-ui)`; see the four-subspaces figure in chapter 1. Keep text inside the viewBox.

Interactive figure:

```html
<figure class="viz" id="viz-xxx">
  <figcaption class="viz-head"><span class="viz-label">Visual</span><span class="viz-title">Title</span>
    <span class="viz-sub">One or two sentences: what is shown and what can be dragged.</span></figcaption>
  <div class="viz-plots cols-2">                     <!-- cols-1, cols-2, or main-side -->
    <div class="plot" id="xxx-a"><div class="plot-cap">Caption under the plot</div></div>
    <div class="plot" id="xxx-b"></div>
  </div>
  <div class="viz-controls" id="xxx-controls"></div>
  <div class="viz-notes">
    <div><h5>Try this</h5><ol><li>...</li></ol></div>
    <div><h5>What to notice</h5><p>...</p></div>
  </div>
</figure>
```

If a plot div holds a `.plot-cap`, move the canvas before it after creating the Plot:
`p.el.insertBefore(p.canvas, p.el.firstChild);` (as in chapter 1).

### 4.1 Explicit claims: what must be a numbered block

**What counts as a claim.** A statement of general scope asserted as true: quantified over a class of objects
("every real $2\times 2$ orthogonal matrix ...", "for any stable system ...", "similar matrices have ..."), or a named
fact (an equivalence, an invariant, a bound, an identity, an existence or uniqueness statement, a characterization).
Such a statement must be the statement of a numbered block on the page.

**Where claims hide** (look in all of these): running prose ("note that every ..."), `probe`, `pattern`, `rem`,
`deduce` and `why` blocks, proofs (auxiliary facts used but proved nowhere), figure notes ("What to notice"), taxonomy
table cells, and self-check answers.

**What does not need its own block.**
1. A computation about a fully specified example, carried out in place (it belongs in an Example, Probe or
   Counterexample block, where the computation is shown).
2. A restatement of a claim that already is a numbered block on the page: add an `a.xref` to that block.
3. A fact proved in another chapter: say it in words and link the chapter (by block id when the id exists, see the
   block index); do not duplicate the block. Exception: when the fact is central to this chapter and is not a numbered
   block anywhere, make it a block here with a short proof or a pointer to where it is proved.
4. Definitions (they are Definition blocks), historical and attribution statements, and standard named results from
   outside the guide used as tools (Cauchy's integral theorem, existence and uniqueness for ordinary differential
   equations), which are named and cited inline.
5. Heuristics, interpretations and rules of thumb, which must be marked as such ("Heuristically, ...", "As a rule of
   thumb, ...") inside a Remark and never phrased as facts. If a heuristic can be made precise cheaply, make it a
   Proposition instead.

**How to promote a claim.**
- Type: Theorem for central results of the chapter; Proposition for secondary results of standalone interest (most
  promotions); Lemma for an auxiliary step used in a later proof; Corollary for an immediate consequence of the block
  just before it.
- Place the block where the claim is first made. The prose motivates, the block states, the proof follows. Keep the
  narrative: leave a one-line bridge in the paragraph, probe or pattern ("this is <a class="xref" ...></a>") rather
  than deleting the exploration. Never nest a block inside another block.
- Group small related claims into one block with (i), (ii), (iii), as in chapter 2's orthonormal-expansion
  proposition. Do not promote trivialities that nothing uses.
- The statement is self-contained: it names its objects and hypotheses ("Let $A \in \R^{n\times n}$ be ..."), so it
  reads correctly out of context. If the original claim was false or imprecise, state less or add hypotheses.
- Every new block is followed by `div.proof`, `details.proof` (sketch) or `p.src` (precise source).
- Ids: `prop-*`, `lem-*`, `cor-*`, `thm-*`, kebab-case, unique on the page, never renaming existing ids. Never type
  a block number; replace any typed number on the page with an `a.xref`. A short `data-name` (2–6 words, sentence
  case) on every new block.

## 5. Notation conventions (global; keep consistent across chapters)

| Symbol | Meaning |
| --- | --- |
| $\F$ | $\R$ or $\C$ |
| $x, b$ lowercase italic; $A, B$ uppercase italic | vectors (columns), matrices |
| $A^\T$, $A^*$, $A^{-1}$, $A^+$ | transpose, conjugate transpose, inverse, Moore–Penrose pseudoinverse |
| $\inner{x}{y} = y^* x$ | inner product, linear in the first slot; on $\R^n$, $x^\T y$ |
| $\norm{x}$, $\norm{x}_p$ | Euclidean norm; $p$-norm |
| $\norm{A}$ = $\norm{A}_2$, $\norm{A}_F$ | spectral (induced 2-) norm, Frobenius norm |
| $\Null(A)$, $\Range(A)$, $\rank A$ | null space, range, rank (macros `\Null`, `\Range`, `\rank`) |
| $\Lambda(A)$ | spectrum (set of eigenvalues). Trefethen and Embree write $\sigma(A)$; say so in chapter 6 |
| $\lambda_i$, $\rho(A)$, $\alpha(A)$ | eigenvalues, spectral radius $\max\abs{\lambda}$, spectral abscissa $\max \Re\lambda$ |
| $W(A)$, $\omega(A)$ | numerical range, numerical abscissa $\max \Re W(A) = \lambda_{\max}((A+A^*)/2)$ |
| $\sigma_1 \ge \dots \ge \sigma_r > 0$ | singular values; $\sigma_{\min}$; $\kappa(A) = \sigma_1/\sigma_n$ |
| $\Lambda_\eps(A)$ | $\eps$-pseudospectrum |
| $A \succ 0$, $A \succeq 0$ | positive definite, positive semidefinite |
| $P_{\mathcal S}$ | orthogonal projector onto the subspace $\mathcal S$ |
| $e^{At}$ | matrix exponential; continuous time $t$, discrete time $k$; $\dot x = \dd x/\dd t$ |
| $(A, B, C, D)$; $x \in \R^n, u \in \R^m, y \in \R^p$ | state-space system $\dot x = Ax + Bu$, $y = Cx + Du$ |
| $G(s) = C(sI-A)^{-1}B + D$ | transfer function; Laplace variable $s$; $z$ for discrete time |
| $W_c(t_f)$, $W_o(t_f)$, $W_c$, $W_o$ | finite-horizon (horizon $t_f$) and infinite-horizon Gramians |
| $P$ | Lyapunov solution (ch. 7) and Riccati solution (ch. 11); both are quadratic value functions |
| $Q \succeq 0$, $R \succ 0$ | LQR state and input weights; $K$ the state-feedback gain, $u = -Kx$ |
| $L$ | observer or Kalman gain (matrix) |
| $W$, $V$ | process and measurement noise covariances (ch. 11) |
| $\Sigma$ | Kalman error covariance in ch. 11 (say explicitly that it is not the SVD's $\Sigma$) |
| $G(s)$, $K(s)$, $L(s) = G(s)K(s)$ | plant, controller, loop transfer function in loop analysis (ch. 10, 12) |
| $S = (1+L)^{-1}$, $T = L(1+L)^{-1}$ | sensitivity and complementary sensitivity |
| $\norm{G}_{\mathcal H_2}$, $\norm{G}_{\mathcal H_\infty}$ | system norms |
| $r(t)$, $W$, $\tau$, $\phi$ | firing rates, connectivity, time constant, gain function (ch. 13) |

MathJax macros available on every page: `\R \C \F \Z \Null \Range \tr \rank \diag \spn \Re \Im \T \eps \dd`,
`\inner{x}{y}`, `\norm{x}`, `\abs{x}`. Write `A^\T` for transpose. In HTML, write `&lt;` and `&gt;` inside math
(`$a &lt; b$`). Put spaces around `&` in matrices. Escape a literal dollar as `\$`.

## 6. The runtime (`assets/lt.js`): what to use

Everything is under `window.LT`. Do not load other libraries.

**Numerics `LT.mat` (`M`)**: matrices are arrays of rows. `zeros eye clone T add sub scale mul mv dot vnorm vadd vsub
vscale unit outer diag diagOf trace col fromCols block blocks sym kron rot(θ)`, `lu det logAbsDet solve inv lstsq qr
chol eigSym svd(A, {full}) rank norm2 cond pinv hess`, `schur(A)` (complex Schur: `Tr Ti Qr Qi values`), `eigvals(A)`
(complex `{re, im}` sorted by real part), `eig(A)` (values and unit eigenvectors `{re:[...], im:[...]}`), `eig2(A)`
(closed form 2×2 with `tr det disc real values vectors`), `spectralRadius spectralAbscissa numericalAbscissa`,
`expm`, `lyap(A,Q)` solves $AX + XA^\T + Q = 0$, `dlyap(A,Q)` solves $AXA^\T - X + Q = 0$, `care dare lqr dlqr`,
`sigminShift(A, zr, zi)` = $\sigma_{\min}(zI - A)$, `rng(seed) randn(seed) randMat(m, n, seed, scale)`.
Tested in `tools/test_lt.js`; Lyapunov and Riccati use Kronecker solves, fine up to $n \approx 20$; `eigvals` of a
200×200 matrix takes about 0.2 s.

**Complex `LT.cx`**: `of add sub mul div abs arg conj exp sqrt scale` on `{re, im}`.

**Systems `LT.sys`**: `freq(A,B,C,D,w)` → $G(i\omega)$; `bode(A,B,C,D,ws)` → `{mag, db, phase}` (unwrapped degrees);
`logspace(a,b,n)`, `linspace`; `c2d(A,B,h)` → `{Ad, Bd}`; `ctrb obsv gramC gramO gramCt(A,B,t)`; `poly(roots)`,
`polyval(p, s)`, `roots(p)`; `place(A,B,poles)` (single input, Ackermann, returns 1×n `K`); `zpk(zeros,poles,k)` → `s
=> G(s)`; `tf2ss(num, den)`; `sim(A,B,C,D,u,x0,tEnd,h)` exact zero-order-hold simulation; `rk4(f, x0, dt, steps)`.

**Formatting**: `LT.fmt(x, d)` (true minus sign), `LT.fmtC(z, d)`, `LT.fmtSig(x, sig)`, `LT.sup(k)`, `LT.sub(k)`.

**Plot** `new LT.Plot(container, opts)`: canvas plot in world coordinates. Options: `xlim, ylim, equal` (same scale on
both axes; use for geometry), `aspect` (height/width when not equal), `height`, `minH, maxH`, `grid: 'paper' | 'lines' |
'none'`, `axes` (axes through the origin), `frame: true` (boxed axes with ticks; use for time series, Bode, spectra),
`xlabel, ylabel, logx, logy, label` (aria label), `xfmt, yfmt`, `clip`. Set `p.draw = (g, p) => {...}`; call
`p.redraw()` after state changes (batched per frame). `p.addHandle({get: () => [x, y], set: (x, y) => {...}, color:
'c1', r: 7, snap: 0.05, constrain: (x, y) => [x, y], label})` makes a draggable point. `p.onClick(x, y)`,
`p.onHover(x, y)`, `p.onLeave()`, `p.after = g => {...}` (drawn after clipping, for labels outside the frame),
`p.setLimits(xlim, ylim)`, `p.gridXY(nx, ny)`, `p.X(x) p.Y(y) p.invX(px) p.invY(py)`.

**Painter `g`** (world coordinates unless `px: true`): `line(x0,y0,x1,y1,st) hline vline ray(point, dir, st)
path(points, st) poly(points, {fill, fillAlpha, color}) band(upper, lower, st) arrow(p0, p1, {color, width, label,
dash}) dot(p, {r, color, hollow}) marker(p, {shape: 'x' | 'o', size, color}) text(p, str, {size, color, align, font:
'ui' | 'mono', italic, dx, dy, px}) curve(f, t0, t1, st) circle(c, r, st) ellipse(c, M2x2, st) fn(f, st) rightAngle(p,
d1, d2) heat(f(x,y), {range, cmap: 'seq' | 'div'}) heatGrid(F, nx, ny, {range, cmap}) contour(f, levels, st)
contourGrid(F, nx, ny, levels, st) field(f, {n, len}) traj(f, x0, {T, dt, color, both, arrowAt})`.
Style keys: `color` (theme name `ink ink-2 muted axis accent c1..c8 good warn bad`, or CSS colour), `width`, `alpha`,
`dash`.

**Animation** `LT.animate(step(dt, t), {el, autoplay})` → `{play, pause, toggle, reset, running}`; runs only while the
figure is on screen. Respect `LT.reducedMotion` (do not autoplay when true). `LT.throttle(fn)`, `LT.debounce(fn, ms)`.

**UI** `const ui = LT.ui.panel('#xxx-controls')`: `ui.slider({id, label, min, max, step, value, digits, fmt, log,
onInput})`, `ui.select({id, label, options: [[value, text], ...], value, onChange})`, `ui.toggle({id, label, value,
onChange})`, `ui.button({label, onClick, kind: 'primary'})`, `ui.buttons([...])`, `ui.readout()` → `{set(html)}`,
`ui.note(html)`. Static labels may contain `$...$` (typeset once on load). Helpers: `LT.ui.mat(A, digits, {name})`,
`LT.ui.vec(v)`, `LT.ui.kv([[k, v], ...])`, `LT.ui.legend([{color, label, kind: 'dot' | 'dash' | 'area'}])`.

**Live readouts are plain HTML, never MathJax** (re-typesetting on every drag is slow): use `<i>x</i><sub>r</sub>`,
`det <i>A</i>`, Unicode subscripts in canvas labels (`'b₁'`), `<span class="num">` for numbers, and tags
`<span class="tag">`, `<span class="tag good">`, `<span class="tag bad">` for state.

## 7. Visual design rules for widgets

- Colour carries meaning and is consistent within a figure; reuse chapter 1's conventions where they apply:
  `c1` blue = first object or "range/reachable" things; `c2` orange = second object; `c3` green = solutions,
  projections, stable/good outcome; `c7` violet = the moving test vector or state; `c8` red = null spaces, errors,
  residuals, unstable; `c4` yellow = targets and right-hand sides. Dashed lines for complements and references.
  Name every colour in a legend (`LT.ui.legend`) or label when a figure has two or more series.
- Lines 2 px (data), 1–1.25 px (references), arrows 2–2.75 px; markers r ≥ 4. Grid is recessive.
- Text in canvases uses ink colours, never the series colour. Keep labels clear of handles and of each other.
- Every figure must open in an informative state (good defaults; never an empty plot) and must work at phone width
  (plots stack automatically; keep controls few).
- Provide presets (`ui.select`) for the instructive special cases named in the text: the probes and counterexamples
  should be one click away.
- Performance: heavy computations (pseudospectra grids, eigenvalues of large matrices, Lyapunov for $n > 10$) are
  computed once per parameter change, cached, and drawn with `heatGrid` / `contourGrid`; use `LT.throttle` for slider
  input and a coarse grid while dragging with a `LT.debounce` full-resolution pass afterwards. Never recompute heavy
  fields inside `p.draw` on hover redraws.
- Animations: offer a Play/Pause button; default paused if `LT.reducedMotion`.
- Readouts state the key numbers that the text's theorem talks about (e.g. both sides of an inequality) so the user can
  watch a theorem hold.

## 8. Shared files are read-only for chapter authors

Do not edit `assets/lt.js`, `assets/lt.css`, `assets/toc.js`, `ch01_linear_maps.html`, `index.html`,
`notation.html`, or other chapters. If you need a library function, write it inside your chapter's script. If you
need a CSS tweak, use a small `<style>` block in your page's `<head>` scoped to your ids, and report it. Report new
abbreviations so they can be added to the glossary.

## 9. References

Cite precisely: author, title, edition, chapter or section. Prefer open sources and mark them. Verified open copies:
Axler, *Linear Algebra Done Right* 4e (2024, open access, linear.axler.net); Treil, *Linear Algebra Done Wrong* (free,
author page https://sites.google.com/a/brown.edu/sergei-treil-homepage/linear-algebra-done-wrong); Boyd and
Vandenberghe, *Introduction to Applied Linear Algebra* (VMLS, free, https://web.stanford.edu/~boyd/vmls/); Boyd, EE263
course reader (free, https://web.stanford.edu/class/archive/ee/ee263/ee263.1082/notes/ee263coursereader.pdf); Gray,
*Toeplitz and Circulant Matrices: A Review* (free, https://ee.stanford.edu/~gray/toeplitz.pdf); Sontag, *Mathematical
Control Theory* 2e (1998, free author PDF via https://stuff.mit.edu/afs/athena.mit.edu/user/e/s/esontag/www/mct.html);
Åström and Murray, *Feedback Systems* 2e (2021, free, https://www.cds.caltech.edu/~murray/amwiki/Second_Edition.html);
Doyle, Francis and Tannenbaum, *Feedback Control Theory* (1992, free draft PDF, https://www.control.utoronto.ca/people/profs/francis/dft.pdf);
Anderson and Moore, *Optimal Control: Linear Quadratic Methods* (1989, free author PDF; listing
https://e-booksdirectory.com/details.php?ebook=3777); Boyd, El Ghaoui, Feron and Balakrishnan, *Linear Matrix
Inequalities in System and Control Theory* (1994, free, https://web.stanford.edu/~boyd/lmibook/); Anderson, Doyle, Low
and Matni, "System level synthesis", Annu. Rev. Control 47 (2019), arXiv:1904.01634; Li, Sarma, Sejnowski and Doyle,
"Internal feedback in the cortical perception–action loop enables fast and accurate behavior", PNAS 120(39) (2023)
e2300445120.
Standard non-free texts you may cite by chapter: Horn and Johnson *Matrix Analysis* 2e; Bhatia *Matrix Analysis*;
Trefethen and Bau *Numerical Linear Algebra*; Trefethen and Embree *Spectra and Pseudospectra* (2005); Golub and Van
Loan 4e; Luenberger *Optimization by Vector Space Methods* (1969); Kreyszig *Introductory Functional Analysis*;
Hespanha *Linear Systems Theory* 2e (2018); Chen *Linear System Theory and Design* 4e; Brockett *Finite Dimensional
Linear Systems*; Callier and Desoer; Kailath *Linear Systems*; Zhou, Doyle and Glover *Robust and Optimal Control*
(1996); Skogestad and Postlethwaite 2e; Antoulas *Approximation of Large-Scale Dynamical Systems* (2005); Liberzon
*Calculus of Variations and Optimal Control Theory* (2012); Hirsch, Smale and Devaney 3e; Perko 3e; Strogatz 2e;
Oppenheim and Willsky *Signals and Systems* 2e; Dayan and Abbott *Theoretical Neuroscience*; Brunton and Kutz 2e.
Only cite a section number or a theorem number when you are certain of it; otherwise cite the chapter. Journal papers:
give authors, title or short description, journal, year; give a DOI link only if certain.

## 10. Chapter plans

Each plan lists sections (suggested order), the results that must appear, probes and counterexamples, visuals, and
readings. You may improve the order or add material that serves the core questions; keep the scope.

### Chapter 2: Inner products, projections and least squares (`ch02_least_squares.html`, Part I)
Core questions: best approximate solution when $Ax=b$ is inconsistent; smallest solution when there are many; how the
answer depends on the norm.
1. Inner products and norms: definition (real and complex), induced norm, Cauchy–Schwarz (proof), triangle inequality,
   parallelogram law (characterizes inner-product norms), $p$-norms, equivalence of norms in finite dimension (state,
   cite). Probe: unit balls of $\ell_1, \ell_2, \ell_\infty$.
2. Orthogonality: orthogonal complements, $\dim S + \dim S^\perp = n$, $(S^\perp)^\perp = S$; orthonormal bases;
   Gram–Schmidt; QR factorization (reduced and full); orthogonal and unitary matrices preserve inner products.
3. Orthogonal projection: projection theorem (closest point characterized by residual $\perp S$; proof via
   Pythagoras); projector $P = A(A^\T A)^{-1}A^\T$ for full-column-rank $A$, $P = QQ^\T$; characterization
   $P^2 = P = P^\T$; oblique projectors ($P^2 = P$, $P \ne P^\T$) as counterexample: idempotent but not closest-point;
   $\norm{P} > 1$ possible for oblique.
4. Least squares: normal equations $A^\T A \hat x = A^\T b$ (derive by projection and by calculus), existence always,
   uniqueness iff full column rank, residual in $\Null(A^\T)$ (link to chapter 1), QR solution, conditioning
   $\kappa(A^\T A) = \kappa(A)^2$ (state, explain why QR is preferred).
5. Minimum-norm solutions and the pseudoinverse: underdetermined full-row-rank case $x = A^\T(AA^\T)^{-1}b \in
   \Range(A^\T)$; Moore–Penrose pseudoinverse (four Penrose conditions; $A^+b$ is the minimum-norm least-squares
   solution; computed via the SVD in chapter 4); regularization preview (ridge: $(A^\T A + \mu I)^{-1}A^\T b$).
6. The norm changes the answer: minimum $\ell_1$, $\ell_2$, $\ell_\infty$ norm points on a line $a^\T x = c$; $\ell_1$
   favours sparse solutions, possible non-uniqueness; robust $\ell_1$ regression vs $\ell_2$ (outliers), computed by
   iteratively reweighted least squares (IRLS).
Visuals: (a) projection explorer: drag $b$ and direction $a$ (or two spanning vectors), orthogonal projection with
right-angle marker and residual, toggle an oblique projector along a draggable direction $d$ to show it is not the
closest point (readout both distances); (b) least-squares line fit: draggable data points (add a point by clicking),
$\ell_2$ fit with residual segments, readout $A^\T r \approx 0$, toggle $\ell_1$ fit via IRLS and an "add outlier"
button; (c) norm balls: line $a^\T x = c$ (drag), slider $p \in [1, \infty]$ (use $p$ up to 20 and a separate
$\infty$ option), growing ball touching the line, the minimum-norm point, its sparsity for $p = 1$.
Readings: Axler ch. 6; Trefethen and Bau lectures 6–8 and 11; VMLS ch. 12–16; EE263 reader (least squares, least norm).

### Chapter 3: Eigenvalues, diagonalization and Jordan form (`ch03_eigenvalues.html`, Part I)
Core questions: invariant directions; when a matrix decouples into scalar modes; long-run behaviour of $A^k$.
1. Eigenvalues and eigenvectors: definition, characteristic polynomial $p_A(\lambda) = \det(\lambda I - A)$, spectrum
   $\Lambda(A)$, existence over $\C$, conjugate pairs for real $A$, trace = sum and determinant = product of eigenvalues.
   Probes: rotation (no real eigenvectors, $e^{\pm i\theta}$), shear (one eigenvector), projection, reflection.
2. The $2\times 2$ anatomy: $\lambda = \tau/2 \pm \sqrt{\tau^2/4 - \Delta}$ with $\tau = \tr A$, $\Delta = \det A$;
   discriminant cases; preview of the trace–determinant plane of chapter 7.
3. Diagonalization: eigenvectors of distinct eigenvalues are independent (proof); algebraic and geometric
   multiplicity; diagonalizable iff they agree; $A = V\Lambda V^{-1}$, $f(A) = Vf(\Lambda)V^{-1}$, $A^k$.
4. When it fails: generalized eigenvectors, Jordan blocks $J_k(\lambda)$, Jordan normal form (state; cite Axler ch. 8
   or Treil ch. 9 for proof), powers $J_k(\lambda)^n$ with binomial terms $\binom{n}{j}\lambda^{n-j}$, minimal
   polynomial, Cayley–Hamilton (proof sketch via triangular form).
5. Schur triangularization: $A = UTU^*$ (proof by induction); always exists, numerically stable; the strictly upper
   part measures non-normality (preview chapter 6); real Schur form with $2\times 2$ blocks (state).
6. Powers and the spectral radius: $A^k \to 0$ iff $\rho(A) < 1$ (proof via Jordan or Schur), Gelfand's formula
   $\rho(A) = \lim \norm{A^k}^{1/k}$ (state, cite), power iteration and its rate $\abs{\lambda_2/\lambda_1}$.
Invariants and counterexamples: similar matrices share char. polynomial, but equal spectra do not imply similarity
($I$ vs $\begin{bmatrix}1&1\\0&1\end{bmatrix}$); $\Lambda(A+B) \ne \Lambda(A)+\Lambda(B)$; $AB$ and $BA$ share nonzero
eigenvalues with multiplicity (proof via block matrices); eigenvalues are continuous in the entries but eigenvectors
need not be (collision at a Jordan point).
Visuals: (a) eigenvector hunt: unit vector $x$ at angle $\theta$ (drag or animate), $Ax$, the curve of $Ax$ over the
circle (an ellipse), a side plot of the signed angle between $x$ and $Ax$ versus $\theta$ whose zeros are eigen-
directions; presets symmetric, rotation, shear, projection, reflection, defective; (b) iterating $A$: build
$A = V\Lambda V^{-1}$ from eigenvalue sliders and eigenvector angles (plus a "defective" toggle giving a Jordan block),
iterate $x_{k+1} = Ax_k$ from a draggable $x_0$, show trajectory, eigen-directions, normalized direction converging
to the dominant eigenvector, and a log plot of $\norm{x_k}$ with slope $\log\rho(A)$; (c) optional: eigenvalues in the
complex plane as an entry slider moves, showing collision and splitting into a conjugate pair.
Readings: Axler ch. 5 and 8; Treil ch. 4 and 9; Horn and Johnson ch. 1–3; Trefethen and Bau lecture 24 (eigenvalue
problems, Schur form).

### Chapter 4: Symmetric matrices, quadratic forms and the SVD (`ch04_svd.html`, Part I)
Core questions: which matrices are orthogonally diagonalizable; what an arbitrary (rectangular) matrix does
geometrically; best low-rank approximation.
1. Adjoints, symmetric, Hermitian, normal and unitary matrices (definitions; examples; normal includes symmetric,
   skew-symmetric, orthogonal).
2. Spectral theorem: real symmetric ⇒ real eigenvalues, orthonormal eigenbasis (proof via Schur form being both
   triangular and symmetric); normal ⇔ unitarily diagonalizable (proof sketch).
3. Quadratic forms and definiteness: $q(x) = x^\T Ax$, level sets (ellipses, hyperbolas, parallel lines), positive
   definite tests (eigenvalues, Sylvester's criterion on leading principal minors, Cholesky, energy); Loewner order;
   Sylvester's law of inertia (congruence invariants; link to chapter 1's table).
4. Variational characterization: Rayleigh quotient, $\lambda_{\max} = \max R(x)$, Courant–Fischer min–max (state,
   proof sketch), Cauchy interlacing (state), Weyl's inequality (state, used in chapter 6).
5. The SVD: existence (from the spectral theorem for $A^\T A$), geometry (unit sphere to hyperellipsoid with semi-axes
   $\sigma_i u_i$), bases for the four subspaces (link chapter 1), pseudoinverse via SVD (link chapter 2), polar
   decomposition (state).
6. Low-rank approximation and norms: spectral and Frobenius norms via singular values, Eckart–Young–Mirsky (state; proof
   sketch for the 2-norm), condition number, numerical rank, distance to the nearest singular matrix is $\sigma_n$.
7. Eigenvalues versus singular values: $\abs{\lambda_i} \le \sigma_1$, $\prod\abs{\lambda_i} = \prod\sigma_i$, normal ⇔
   $\sigma_i = \abs{\lambda_i}$ (suitably ordered), Weyl's majorant theorem (state, cite Horn and Johnson); the
   counterexample $\begin{bmatrix}1&10\\0&1\end{bmatrix}$ (eigenvalues 1, 1; singular values about 10.1 and 0.099):
   eigenvalues do not measure gain; preview of chapter 6.
Visuals: (a) SVD as rotate, stretch, rotate: animate the unit circle through $V^\T$, $\Sigma$, $U$ with a stage slider;
draggable columns of $A$; show $v_i$, $\sigma_i u_i$ and the eigenvectors for contrast (they coincide only when $A$ is
symmetric); (b) quadratic-form landscape: sliders $\lambda_1, \lambda_2, \theta$; heat map and level curves of $q$;
unit circle with the Rayleigh quotient plotted against angle, max and min at eigenvectors; definiteness tag; (c)
low-rank image approximation: a procedural greyscale image (draw text and shapes into an offscreen canvas, about 80×80),
SVD, slider $k$, show $A_k$, the singular value spectrum on a log axis with $\sigma_{k+1}$ marked, and the errors
$\norm{A-A_k}_2 = \sigma_{k+1}$ and $\norm{A - A_k}_F$ (readout both sides of Eckart–Young).
Readings: Axler ch. 7; Trefethen and Bau lectures 4–5; Horn and Johnson ch. 2, 4 and 7; Brunton and Kutz ch. 1;
Strang, chapter on the SVD.

### Chapter 5: Beyond $\R^n$: norms, operators and Hilbert space (`ch05_hilbert_spaces.html`, Part II)
Core questions: which finite-dimensional facts survive in function spaces; why exponentials and Fourier modes
diagonalize shift-invariant operators; how minimum-norm problems become control problems.
1. Normed and Banach spaces: definitions, completeness; $\ell^p$, $C[a,b]$ with the sup norm, $L^2$; equivalence of
   norms fails in infinite dimension (counterexample $t^n$ in $C[0,1]$: sup norm 1, $L^1$ norm $1/(n+1)$); closed vs
   non-closed subspaces (polynomials in $L^2$); unit ball not compact (orthonormal sequence).
2. Bounded operators: operator norm, bounded ⇔ continuous; induced matrix norms $\norm{A}_1$ (max column sum),
   $\norm{A}_2 = \sigma_1$, $\norm{A}_\infty$ (max row sum) with proofs for 1 and $\infty$; $\rho(A) \le \norm{A}$ for
   every induced norm; Neumann series with bound $\norm{(I-T)^{-1}} \le 1/(1-\norm{T})$ (proof).
3. Hilbert spaces and the projection theorem: projection onto closed subspaces (and closed convex sets; cite
   Luenberger ch. 3), orthonormal bases, Bessel, Parseval, Riesz representation, Fourier series as projection.
4. Adjoints and spectra: adjoint operators, self-adjoint; spectrum $\Lambda(T)$ = where $T - \lambda I$ is not boundedly
   invertible; counterexamples: right shift on $\ell^2$ (isometry, not surjective; spectrum the closed unit disk),
   left shift (every $\abs\lambda < 1$ is an eigenvalue), multiplication by $t$ on $L^2[0,1]$ (spectrum $[0,1]$, no
   eigenvalues); spectral theorem for compact self-adjoint operators (state, cite Kreyszig).
5. Shift invariance and the Fourier basis: circulant matrices are diagonalized by the discrete Fourier transform (DFT),
   $C = F^* \diag(\hat c) F$ with eigenvalues the DFT of the first column (proof: $\omega^k$ eigenvectors); convolution
   theorem; Toeplitz vs circulant (Szegő asymptotics, cite Gray); continuous version: $e^{st}$ are eigenfunctions of
   every linear time-invariant operator (preview chapter 8).
6. Minimum-norm problems: in a Hilbert space, $\min\norm{x}$ subject to $\inner{x}{y_i} = c_i$ is attained at
   $x = \sum\alpha_i y_i$ with Gram system $G\alpha = c$ (proof by projection); example: minimum-energy input steering
   $\dot x = ax + bu$ from 0 to $x_f$ at time $t_f$: $u^*(t) \propto e^{a(t_f - t)}$, with the energy formula; this is
   the scalar case of the controllability Gramian of chapter 9.
Visuals: (a) unit balls and induced norms: draggable $2\times 2$ $A$; for $p \in \{1,2,\infty\}$ draw the unit ball,
its image, and the smallest $p$-ball containing the image; readout $\norm{A}_p$ from the picture versus the formula;
(b) Fourier projection and Gibbs: presets (square, sawtooth, triangle, $\abs{\sin}$) and a "draw your own function"
mode, slider $N$; show $S_N f$, a log plot of the $L^2$ error versus $N$, and the sup error; the overshoot near a jump
approaches about 9% of the jump size (Wilbraham–Gibbs); (c) circulant matrices: kernel taps $h$ (sliders), heat map of
the circulant $C$ ($N = 32$), choose mode $k$, show that $C$ maps the Fourier mode to a scaled, phase-shifted copy with
factor $\hat h_k$, plot $\abs{\hat h}$; contrast with a random input whose shape changes.
Readings: Luenberger ch. 2–3 and 6; Kreyszig ch. 2–3 and 7–9; Gray, chapters on circulant and Toeplitz matrices;
Trefethen and Embree, part on Toeplitz matrices (optional).

### Chapter 6: Perturbation, non-normality and pseudospectra (`ch06_nonnormality.html`, Part II)
Core questions: how far eigenvalues and solutions move under small errors; when eigenvalues mislead about dynamics;
what replaces them.
1. Conditioning of linear systems: $\kappa(A)$, the relative error bound (proof), distance to singularity $= \sigma_n$.
2. Hermitian perturbation: Weyl's inequality $\abs{\lambda_i(A+E) - \lambda_i(A)} \le \norm{E}$ (proof via
   Courant–Fischer); Davis–Kahan $\sin\Theta$ for eigenvectors, gap dependence (state, cite Bhatia ch. VII).
3. Non-normal perturbation: Bauer–Fike (proof); eigenvalue condition number $\kappa(\lambda) = \norm{x}\norm{y} /
   \abs{y^*x}$ with left and right eigenvectors; Jordan block $J_n(0) + \eps e_n e_1^\T$ has eigenvalues
   $\eps^{1/n}e^{2\pi i k/n}$ (proof).
4. Pseudospectra: three equivalent definitions ($\sigma_{\min}(zI - A) < \eps$; $\norm{(zI-A)^{-1}} > 1/\eps$;
   eigenvalues of $A + E$ with $\norm{E} < \eps$), equivalence (proof sketch, cite Trefethen and Embree Thm 2.1);
   normal matrices: $\Lambda_\eps$ is the union of $\eps$-disks; notation note ($\sigma(A)$ in Trefethen and Embree).
5. Numerical range and abscissas: $W(A)$ (convex, contains $\Lambda(A)$, Toeplitz–Hausdorff, state), numerical
   abscissa $\omega(A) = \lambda_{\max}(\tfrac12(A+A^*))$, spectral abscissa $\alpha(A)$.
6. Transient growth: $\norm{e^{tA}} \le e^{t\,\omega(A)}$ (proof via $\tfrac{\dd}{\dd t}\norm{x}^2$), long-time rate
   $\alpha(A)$, initial slope $\omega(A)$; lower bound via pseudospectra (Kreiss matrix theorem, state and cite TE ch.
   18); worked example $A = \begin{bmatrix}-1 & w\\ 0 & -2\end{bmatrix}$ with closed-form $e^{tA}$ and peak growth
   about $w/4$ for large $w$ (derive what you claim, or state the exact peak numerically); the Schur form exposes the
   feedforward coupling (link to chapter 13); Trefethen et al. "Hydrodynamic stability without eigenvalues" (Science,
   1993) as context.
Visuals: (a) pseudospectra explorer: presets (normal $2\times 2$; non-normal $2\times 2$ with coupling slider $w$;
Jordan block $J_n(0)$ for $n \le 8$; a feedforward chain with decay; a random $8\times 8$), heat map of
$\log_{10}\sigma_{\min}(zI-A)$ with contours at $\eps = 10^{-1}, 10^{-2}, \dots$, eigenvalue dots, slider $\eps$
highlighting one contour, and a "perturbation cloud" button scattering eigenvalues of $A + E$ for random $E$ with
$\norm{E} = \eps$ (they fill $\Lambda_\eps$); (b) transient growth: $\norm{e^{tA}}$ versus $t$ with the envelopes
$e^{\alpha t}$ and $e^{\omega t}$; phase plane of the $2\times 2$ case with the worst initial condition (top right
singular vector of $e^{t^*A}$) and trajectories crossing circles; readout of the peak and its time; (c) Jordan-block
sensitivity: $n$ slider, $\log\eps$ slider; eigenvalues of $J_n(0) + \eps E$ (corner perturbation exactly on the
circle of radius $\eps^{1/n}$; random $E$ nearby); readout of the amplification $\eps^{1/n}/\eps$.
Readings: Trefethen and Embree ch. 1–2 and 14–18; Bhatia ch. III, VI–VIII; Horn and Johnson ch. 6; Trefethen and Bau
lectures 12, 24–26; Golub and Van Loan, section on eigenvalue sensitivity.

### Chapter 7: Autonomous linear systems: flows, modes and stability (`ch07_autonomous_systems.html`, Part III)
Core questions: what $\dot x = Ax$ and $x_{k+1} = Ax_k$ can do; how to certify stability without solving.
1. Setting: continuous time (CT) and discrete time (DT); existence and uniqueness; superposition.
2. The matrix exponential: series definition, convergence, $\frac{\dd}{\dd t}e^{At} = Ae^{At}$, semigroup property,
   $e^{A+B} = e^Ae^B$ when $AB = BA$ and the counterexample when not; computation by diagonalization, Jordan form,
   Laplace ($e^{At} = \mathcal L^{-1}\{(sI - A)^{-1}\}$); $e^{At}$ is a polynomial in $A$ of degree $\le n-1$.
3. Modes: $x(t) = \sum_i (w_i^* x_0)\, e^{\lambda_i t} v_i$ with left eigenvectors $w_i$ (biorthogonal normalization);
   complex pairs give rotation in a real plane (real Jordan form $\begin{bmatrix}\sigma & \omega\\ -\omega &
   \sigma\end{bmatrix}$); Jordan blocks give $t^k e^{\lambda t}$; stable, unstable and centre subspaces.
4. Planar classification: trace–determinant plane (saddles $\Delta < 0$, nodes, spirals, centres, degenerate cases,
   the parabola $\Delta = \tau^2/4$); topological classification of hyperbolic linear flows by $\dim E^s$ (state, cite
   Perko or Hirsch–Smale–Devaney): a discrete invariant versus the continuous invariants of similarity.
5. Stability: definitions (Lyapunov, asymptotic, exponential); CT: asymptotically stable ⇔ $A$ Hurwitz; marginal
   stability (imaginary-axis eigenvalues with trivial Jordan blocks); DT analogue with the unit disk; sampling map
   $z = e^{sh}$ sends the left half-plane into the unit disk.
6. Lyapunov's method: $V(x) = x^\T Px$, Lyapunov equation $A^\T P + PA = -Q$; theorem: $A$ Hurwitz ⇔ for some (every)
   $Q \succ 0$ there is a unique $P \succ 0$, $P = \int_0^\infty e^{A^\T t}Qe^{At}\dd t$ (proof); decay-rate bound from
   $P$; DT version; Lyapunov ellipsoids versus Euclidean circles under non-normal $A$ (link to chapter 6).
7. Time-varying systems: state-transition matrix $\Phi(t, t_0)$, its properties; frozen-time eigenvalues do not decide
   stability: give an explicit counterexample and verify it numerically in a small figure or readout (the classical
   Markus–Yamabe linear time-varying example works; derive or check what you state).
Visuals: (a) trace–determinant atlas: left panel the $(\tau, \Delta)$ plane with the parabola and region labels and a
draggable point; right panel the phase portrait of a representative matrix (direction field, trajectories, eigen-
directions, animated particles); extra sliders for a shape parameter (eigenbasis angle and non-normality) to move within
a similarity class; (b) modes and the exponential: drag $x_0$; trajectory and time series $x_1(t), x_2(t)$ with the
modal components overlaid; slider $t$ with $e^{At}$ readout; (c) Lyapunov ellipses: Hurwitz $A$ with adjustable
non-normality, $Q$ adjustable, level sets of $x^\T Px$, trajectories crossing them inward, and side plots of $V(x(t))$
(monotone) and $\norm{x(t)}^2$ (not necessarily monotone).
Readings: Hirsch, Smale and Devaney ch. 2–6; Perko ch. 1; Strogatz ch. 5; Hespanha, lectures on solutions of LTI and
LTV systems and on Lyapunov stability; EE263 reader; Boyd et al. LMI book ch. 2 (Lyapunov inequalities).

### Chapter 8: Input–output systems (`ch08_input_output.html`, Part III)
Core questions: response to inputs; why exponentials and sinusoids diagonalize linear time-invariant (LTI) systems;
internal versus external descriptions.
1. State-space systems with inputs: $(A,B,C,D)$, single-input single-output (SISO) and multiple-input multiple-output
   (MIMO); variation of constants (derive); impulse response $h(t) = Ce^{At}B\,\mathbb 1(t) + D\delta(t)$; convolution;
   DT Markov parameters $CA^{k-1}B$.
2. Exponentials are eigenfunctions: input $e^{st}$ gives output $G(s)e^{st}$ (steady state) for $\Re s$ beyond the
   poles; Laplace transform and $G(s) = C(sI-A)^{-1}B + D$; invariance under state coordinate change $(TAT^{-1}, TB,
   CT^{-1}, D)$ (proof): an equivalence and its invariant.
3. Poles, zeros and the geometry of $\abs{G(i\omega)}$: poles $\subseteq \Lambda(A)$; zeros; gain-phase from distances
   and angles to poles and zeros; minimum phase versus right-half-plane zeros (initial undershoot counterexample).
4. Frequency response and Bode plots: sinusoidal steady state (proof for stable systems); first and second order
   ($\zeta, \omega_n$, resonance peak $1/(2\zeta\sqrt{1-\zeta^2})$ for $\zeta < 1/\sqrt2$); Bode asymptotes; the Bode
   gain–phase relation for minimum-phase systems (state, cite).
5. Bounded-input bounded-output (BIBO) versus internal stability: BIBO ⇔ $\int\abs{h} < \infty$ ⇔ (rational, proper)
   poles in the open left half-plane; internal ⇒ BIBO; converse fails with a cancelled unstable mode (explicit
   counterexample, simulate the hidden state) leading to chapter 9.
6. Realization: controllable canonical form; non-uniqueness; dimension and minimality preview.
7. Multivariable systems: poles, zeros and directions (added after the first version, at the user's request; section
   id `s-mimo`, after `s-real`). Transfer matrix $G(s) \in \R(s)^{p\times m}$ and its normal rank; probes showing that
   entries mislead: multiplicity ($I/(s+1)$ has McMillan degree 2, $\mathbb 1\mathbb 1^\T/(s+1)$ degree 1, where
   $\mathbb 1$ is the all-ones vector); a plant with no zero in any entry but a right-half-plane transmission zero,
   $G = \begin{bmatrix}1/(s+1) & 2/(s+3)\\ 1/(s+1) & 1/(s+1)\end{bmatrix}$, zero at $s = 1$ with input and output
   zero directions $\propto (1, -1)$; and the converse, entries with zeros but no transmission zero,
   $G = \frac{1}{s+1}\begin{bmatrix}s-1 & s\\ 1 & 1\end{bmatrix}$; $\det G$ hides a zero that coincides with a pole
   ($\diag((s+2)/(s+1), (s+1)/(s+2))$ has $\det G = 1$). Smith–McMillan form (state, cite), poles, zeros, McMillan
   degree; rank-drop characterization of zeros that are not poles (proof); poles and zeros from minors (state, cite
   MacFarlane and Karcanias 1976 or Skogestad and Postlethwaite ch. 4). State space: Rosenbrock system matrix
   $\begin{bmatrix}sI - A & -B\\ C & D\end{bmatrix}$, invariant zeros, zero blocking with input $u_0e^{zt}$ and
   initial state $x_0$ (proof), minimal realization implies invariant zeros equal transmission zeros (state, cite),
   square $D$ invertible implies zeros are $\Lambda(A - BD^{-1}C)$ (proof via Schur complement), $\det P(s) =
   \det(sI - A)\det G(s)$ for square systems (proof). For stable $G$, a real right-half-plane zero $z &gt; 0$ with
   output direction $y_z$ forces $\int_0^\infty e^{-zt}y_z^*y(t)\,\dd t = 0$ for every bounded input applied from rest,
   so $y_z^*y$ changes sign unless it vanishes identically (proof; the multivariable version of the undershoot theorem
   in section `s-pz`). Gains and directions: at each $\omega$ the SVD
   $G(i\omega) = U\Sigma V^*$ gives principal gains $\sigma_i(G(i\omega))$, input directions (columns of $V$) and output
   directions (columns of $U$); $\sigma_{\min} \le \norm{G u}/\norm{u} \le \sigma_{\max}$ (proof); principal gains are
   invariant under unitary changes of input and output coordinates while entries are not; $\abs{g_{ij}} \le
   \sigma_{\max}$; condition number; the singular-value plot as the multivariable Bode magnitude plot; there is no
   single phase. Example: the ill-conditioned distillation column of Skogestad and Postlethwaite (ch. 3),
   $G = \frac{1}{75s+1}\begin{bmatrix}87.8 & -86.4\\ 108.2 & -109.6\end{bmatrix}$ with $\sigma_{\max} \approx 197.2$,
   $\sigma_{\min} \approx 1.39$, condition number $\approx 141.7$. A taxonomy table: SISO notion and its MIMO analogue.
Visuals: (a) pole–zero playground: s-plane with draggable conjugate pole pairs and zeros, gain; impulse and step
responses; Bode magnitude and phase; a test frequency $\omega$ (slider or hover) drawing the vectors from $i\omega$ to
each pole and zero, with the product formula in the readout; (b) sinusoid in, sinusoid out: second-order system with
$\zeta, \omega_n$ sliders, input frequency slider, input and output waveforms with transient, amplitude ratio and phase
lag matched to a marker on the Bode plot; (c) convolution as superposition: an input built from pulses (or drawn),
showing scaled shifted impulse responses and their sum converging to $y$; (d) for `s-mimo`, principal gains and
directions of a $2\times 2$ plant: at $\omega = 0$ (real $G(0)$) the unit circle of inputs with a draggable input
direction and its image ellipse with the singular directions, gain readout between $\sigma_{\min}$ and
$\sigma_{\max}$; beside it the singular-value plot $\sigma_i(G(i\omega))$ against the entry magnitudes
$\abs{g_{ij}(i\omega)}$; presets for a decoupled plant, the distillation column, the right-half-plane-zero plant and a
rotated-coordinates plant with a rotation slider (entries change, principal gains do not); optionally a step-response
panel showing the undershoot of $y_z^*y$ for the right-half-plane-zero plant.
Readings: Oppenheim and Willsky ch. 2–3 and 9–10; Åström and Murray ch. 6, 9–10; Chen ch. 2 and 4; Hespanha, lectures
on impulse response, transfer functions and realizations; Doyle, Francis and Tannenbaum ch. 2.

### Chapter 9: Controllability, observability and minimality (`ch09_controllability.html`, Part IV)
Core questions: can inputs steer the state anywhere; can outputs reveal it; which part of the state matters for
input–output behaviour.
1. Reachability as a range question: the map from inputs on $[0, t_f]$ to $x(t_f)$; its range is the reachable set.
2. Controllability matrix and Kalman's rank test (proof via Cayley–Hamilton, both directions); DT version as a plain
   linear system; invariance under similarity and under state feedback.
3. Gramians and minimum energy: $W_c(t_f) = \int_0^{t_f} e^{At}BB^\T e^{A^\T t}\dd t$; controllable ⇔ $W_c(t_f) \succ
   0$; minimum-energy input $u^*(t) = B^\T e^{A^\T(t_f - t)}W_c(t_f)^{-1}(x_f - e^{At_f}x_0)$ with its energy (derive
   as a minimum-norm problem, link chapter 5); unit-energy reachable ellipsoid $\{x: x^\T W_c^{-1}x \le 1\}$;
   infinite-horizon Gramian from the Lyapunov equation; graded (energy) controllability.
4. PBH test (Popov–Belevitch–Hautus): rank $[\lambda I - A,\ B] = n$ for all $\lambda$ ⇔ no left eigenvector orthogonal
   to $B$; modal interpretation; counterexample: a repeated eigenvalue with two independent eigenvectors cannot be
   controlled from one input (cyclicity).
5. Observability and duality: observability matrix, Gramian, unobservable subspace (largest $A$-invariant subspace in
   $\Null(C)$); duality theorem; state reconstruction as least squares on the output record.
6. Kalman decomposition and minimal realizations: the four-part decomposition (static diagram), $G(s)$ depends only on
   the controllable and observable part, minimal ⇔ controllable and observable, all minimal realizations are similar
   (state, cite); stabilizability and detectability.
7. Graded controllability in large networks: energy grows quickly with few driver nodes (Pasqualetti, Zampieri and
   Bullo, IEEE Trans. Control Netw. Syst., 2014); caution about binary rank tests.
Visuals: (a) reachability ellipsoid and minimum-energy steering: $2\times 2$ $A$ presets and sliders, draggable $B$
direction, horizon slider; ellipsoid from $W_c(t_f)$; click a target to animate the minimum-energy trajectory, plot
$u^*(t)$ and energy; aligning $B$ to make a mode uncontrollable collapses the ellipse; show left eigenvectors and modal
controllabilities $\abs{w_i^*B}$; (b) what the output sees: draggable $C$; two initial conditions differing along the
unobservable direction give identical outputs; observability ellipse; (c) Kalman decomposition block diagram (static
SVG, optionally with hover highlighting).
Readings: Hespanha, parts on controllability, observability and realization; Sontag ch. 3 and 6; Chen ch. 6–7;
Brockett; EE263 reader (controllability, observability, Gramians); Zhou, Doyle and Glover ch. 3.

### Chapter 10: Feedback: state feedback, observers and the loop (`ch10_feedback.html`, Part IV)
Core questions: how far feedback reshapes dynamics; what it costs; what the loop view adds.
1. State feedback and pole placement: closed loop $A - BK$; pole placement theorem (SISO proof via controllable
   canonical form, Ackermann's formula; MIMO statement); uncontrollable modes are fixed (PBH).
2. Costs: control effort grows with pole speed; peaking; pole placement fixes eigenvalues but not eigenvectors (non-normal
   closed loops, poor transients) as counterexample to "eigenvalues are the design".
3. Observers: Luenberger observer, error dynamics $A - LC$, duality with pole placement, speed versus noise.
4. Separation principle: closed-loop spectrum $\Lambda(A-BK) \cup \Lambda(A-LC)$ (proof via block-triangular form in
   $(x, e)$ coordinates); caveat: robustness is not separated (chapter 12).
5. The loop in transfer-function form: plant $G(s)$, controller $K(s)$, loop $L(s) = G(s)K(s)$, sensitivity $S$,
   complementary sensitivity $T$, $S + T = 1$; disturbance rejection and noise amplification; internal stability needs
   all four closed-loop transfer functions stable (counterexample with cancellation).
6. Integral action and the internal model principle: zero steady-state error to steps robustly (proof by final value
   theorem); Francis and Wonham's internal model principle (Automatica, 1976; state informally); robust perfect
   adaptation in bacterial chemotaxis as integral feedback (Yi, Huang, Simon and Doyle, PNAS, 2000); PID
   (proportional–integral–derivative) control in one paragraph.
Visuals: (a) pole placement: plant presets (double integrator, unstable second order, oscillator), drag desired poles
(conjugate pair or two reals), gain from Ackermann, phase-plane trajectories and time plots of $x(t)$ and $u(t)$,
readout of $K$ and peak $\abs u$; (b) observer and separation: oscillator measured in position only, observer speed
slider, measurement-noise slider, true versus estimated states, estimation error, closed-loop eigenvalues; (c) integral
feedback and perfect adaptation: first-order plant with uncertain parameters, step disturbance, proportional versus
integral control, steady-state error readout.
Readings: Åström and Murray ch. 7–8 and 11–12; Chen ch. 8; Sontag ch. 5 and 7; Hespanha, lectures on state and output
feedback; Doyle, Francis and Tannenbaum ch. 3; Francis and Wonham (1976); Yi et al. (2000).

### Chapter 11: Optimal control and estimation: LQR, Kalman filter, LQG (`ch11_lqr_kalman.html`, Part IV)
Core questions: which feedback minimizes a quadratic cost; which estimate is best under Gaussian noise; how they
combine and what that combination does not guarantee.
1. The linear quadratic regulator (LQR) problem: cost, assumptions (stabilizable, detectable, $Q \succeq 0$, $R \succ
   0$), desired outcome.
2. DT LQR by dynamic programming: Bellman recursion, quadratic value function, completing the square, Riccati
   recursion and gain; steady state: discrete-time algebraic Riccati equation (DARE).
3. CT LQR: continuous-time algebraic Riccati equation (CARE); derivation by completing the square,
   $J = x_0^\T Px_0 + \int\norm{R^{1/2}(u + R^{-1}B^\T Px)}^2\dd t$; existence and uniqueness of the stabilizing solution
   (state, cite); Hamiltonian matrix and its $(\lambda, -\lambda)$ symmetry (state); the scalar case in closed form.
4. Extreme cases and invariants: cheap control ($R \to 0$) and expensive control ($R \to \infty$: stable poles stay,
   unstable poles mirror to $-\bar p$; prove in the scalar case); symmetric root locus (state); LQR margins: return
   difference $\abs{1 + K(i\omega I - A)^{-1}B} \ge 1$ (SISO, derive from the CARE or cite Anderson and Moore ch. 5),
   hence gain margin from 1/2 to $\infty$ and phase margin at least $60^\circ$.
5. The Kalman filter: model with process noise covariance $W$ and measurement noise covariance $V$; Gaussian
   conditioning lemma (proof); predict–update equations; gain; covariance recursion; steady state; the linear quadratic
   estimator (LQE) is the dual of LQR.
6. Duality and the linear quadratic Gaussian (LQG) controller: duality table; certainty equivalence and separation
   (state, cite); Doyle's 1978 counterexample "Guaranteed margins for LQG regulators" (IEEE Trans. Autom. Control): LQG
   can have arbitrarily small margins (state; the details belong in chapter 12); links: optimal feedback control in
   motor neuroscience (Todorov and Jordan, Nat. Neurosci., 2002) and Kalman-filter decoders in brain–computer
   interfaces (BCI), one paragraph each.
Visuals: (a) LQR trade-off: plant presets, slider $\log_{10}\rho$ for $R = \rho I$ (or $\rho$ for a scalar input),
optional state-weight shape; closed-loop poles in the s-plane with the full locus as $\rho$ varies; trajectories and
input; cost split $\int x^\T Qx$ and $\int u^\T Ru$; value-function level sets; (b) Kalman filter in action: 2D system
(oscillator or constant velocity), noisy position measurements, sliders for $\log W$ and $\log V$, run and step buttons;
true path, measurements, estimate and covariance ellipse; error and $\tr\Sigma$ over time; comparison with open-loop
prediction; (c) the Riccati map as a dynamical system: scalar DT Riccati map $p \mapsto q + a^2p - a^2b^2p^2/(r +
b^2p)$ as a cobweb diagram, sliders $a, b, q, r$, fixed points, convergence, closed-loop factor readout.
Readings: Anderson and Moore ch. 2–5 and 7–8 (free); Liberzon ch. 6; Åström and Murray ch. 7–8; Sontag ch. 8; Kalman
(J. Basic Eng., 1960); Bertsekas, *Dynamic Programming and Optimal Control*, vol. 1, ch. 4; Recht, "A tour of
reinforcement learning: the view from continuous control" (Annu. Rev. Control Robot. Auton. Syst., 2019; arXiv
1806.09460).

### Chapter 12: Robustness, fundamental limits and model reduction (`ch12_robustness.html`, Part IV)
Core questions: how much model error feedback can tolerate; which limits bind every controller; how far a model can be
simplified with a guarantee.
1. Norms of systems: $\mathcal H_2$ norm (impulse-response energy, $\tr(CW_cC^\T)$, derive) and $\mathcal H_\infty$ norm
   ($\sup_\omega\sigma_{\max}(G(i\omega))$, equals the induced $L^2$ gain; state, cite); computation (Lyapunov for
   $\mathcal H_2$; Hamiltonian bisection for $\mathcal H_\infty$, state, cite Boyd, Balakrishnan and Kabamba 1989).
2. Nyquist criterion and margins: statement (cite Åström and Murray ch. 10), gain margin (GM), phase margin (PM),
   stability margin $\min_\omega\abs{1 + L(i\omega)} = 1/\norm{S}_{\mathcal H_\infty}$; delays erode phase.
3. Small-gain theorem and robust stability: statement and proof idea; multiplicative uncertainty $G(1 + W\Delta)$:
   robust stability ⇔ $\norm{WT}_{\mathcal H_\infty} < 1$ for all $\norm{\Delta}_{\mathcal H_\infty} \le 1$ (state,
   cite Doyle, Francis and Tannenbaum ch. 4).
3b. Multivariable robustness: margins one loop at a time can mislead (added after the first version, at the user's
   request; section id `s-mimo-robust`, after `s-robust`). Generalized Nyquist criterion via $\det(I + L(s))$ (state,
   cite MacFarlane and Postlethwaite 1977 or Skogestad and Postlethwaite ch. 4). The spinning satellite (Skogestad and
   Postlethwaite ch. 3): $G(s) = \frac{1}{s^2 + a^2}\begin{bmatrix}s - a^2 & a(s+1)\\ -a(s+1) & s - a^2\end{bmatrix}$,
   $a = 10$, controller $K = I$, realization $A = \begin{bmatrix}0 & a\\ -a & 0\end{bmatrix}$, $B = I$,
   $C = \begin{bmatrix}1 & a\\ -a & 1\end{bmatrix}$, $D = 0$; closed-loop matrix $A - BC = -I$ and
   $T(s) = \frac{1}{s+1}\begin{bmatrix}1 & a\\ -a & 1\end{bmatrix}$. Probe: with one loop broken and the other closed the
   loop transfer function is $1/s$ (derive): infinite gain margin and $90^\circ$ phase margin in each loop.
   Counterexample: input gains $\diag(1 + \delta_1, 1 + \delta_2)$ give the closed-loop characteristic polynomial
   $s^2 + (2 + \delta_1 + \delta_2)s + (1 + \delta_1)(1 + \delta_2) + a^2\delta_1\delta_2$ (derive), so the loop is
   stable exactly when both coefficients are positive (Proposition), stable on both axes $\delta_2 = 0$, $\delta_1 &gt;
   -1$ and $\delta_1 = 0$, $\delta_2 &gt; -1$, but unstable at $\delta_1 = -\delta_2 = \delta$ once $\abs\delta \ge
   1/\sqrt{1 + a^2} \approx 0.0995$. Multivariable small gain with $\sigma_{\max}$ (cite the earlier small-gain theorem
   if it is stated for matrices, otherwise state the matrix version and cite Zhou, Doyle and Glover ch. 9 or Skogestad
   and Postlethwaite ch. 8): input multiplicative perturbations with $\norm{\Delta}_{\mathcal H_\infty} &lt;
   1/\norm{T}_{\mathcal H_\infty}$ are tolerated; here $\norm{T}_{\mathcal H_\infty} = \sqrt{1 + a^2}$, and the square
   $\max_i\abs{\delta_i} &lt; 1/\sqrt{1 + a^2}$ touches the instability boundary at its corners $(\delta, -\delta)$: the
   bound is tight. Pointers (state, cite): structured singular value $\mu$ for diagonal perturbations (Doyle 1982;
   Zhou, Doyle and Glover ch. 10; Skogestad and Postlethwaite ch. 8) and disk margins (Seiler, Packard and Gahinet,
   "An introduction to disk margins", IEEE Control Syst. Mag., 2020; verify the citation).
4. Fundamental limits: Bode's sensitivity integral $\int_0^\infty\ln\abs{S(i\omega)}\dd\omega = \pi\sum\Re p_i$ over
   unstable open-loop poles (stable $L$ with relative degree at least 2 gives 0; state, cite Freudenberg and Looze 1985;
   proof idea via Cauchy's theorem); waterbed effect; right-half-plane zeros (Poisson integral, state); Stein, "Respect
   the unstable" (IEEE Control Syst. Mag., 2003); hard limits in biology: glycolytic oscillations (Chandra, Buzi and
   Doyle, Science, 2011).
5. LQG has no guaranteed margins: explain Doyle's 1978 example and why separation does not carry robustness; loop
   transfer recovery and $\mathcal H_\infty$ control as responses (state, cite Zhou, Doyle and Glover).
6. Model reduction by balanced truncation: Hankel singular values $\sqrt{\lambda_i(W_cW_o)}$ (similarity invariants,
   proof), balanced realization, truncation preserves stability and satisfies $\norm{G - G_r}_{\mathcal H_\infty} \le
   2\sum_{i>r}\sigma_i$ (state, cite Enns 1984, Glover 1984; Antoulas ch. 7); lower bound $\sigma_{r+1}$ for any order-r
   approximation; Moore 1981 (principal component analysis in linear systems).
Visuals: (a) Nyquist and margins: loop presets ($K e^{-sT}/(s(\tau s+1))$, $K/(s+1)^3$), sliders $K$, delay $T$,
$\tau$; Nyquist curve with the $-1$ point, unit circle, GM and PM marked, minimum-distance circle; Bode of $L$;
closed-loop step response; (b) the waterbed: $\ln\abs{S(i\omega)}$ on a linear frequency axis with positive and
negative areas shaded and the numerical integral compared with $\pi\sum p_i$; sliders for gain, bandwidth, extra lag,
and an optional unstable open-loop pole with a stabilizing controller; (c) balanced truncation: seeded random stable
system of order 10–14 (regenerate button) or a ladder preset; Gramians, Hankel singular values (log bars), slider $r$,
Bode magnitude of $G$ and $G_r$, error $\abs{G - G_r}$ against the bound and the lower bound; (e) for
`s-mimo-robust`, one loop at a time versus together: the $(\delta_1, \delta_2)$ plane with the exact stability region
shaded, both axes marked as the loop-at-a-time tests, the small-gain square, a draggable perturbation point, slider
$a$; second panel with the closed-loop eigenvalues (or a closed-loop response) for the current point; presets "one
loop, gain $\times 3$", "both $+10\%$", "opposite $\pm 10\%$", "$a = 0$".
Readings: Doyle, Francis and Tannenbaum ch. 2, 4 and 6 (free draft); Zhou, Doyle and Glover ch. 4, 6–9; Skogestad and
Postlethwaite ch. 5, 7 and 11; Åström and Murray ch. 10, 13–14; Antoulas ch. 7; Doyle (1978); Stein (2003); Chandra et
al. (2011).

### Chapter 13: Linear theory in neural circuits and beyond (`ch13_neural_bridges.html`, Part V)
Core questions: what linear tools explain about recurrent neural dynamics; where they stop; how linear methods reach
nonlinear and data-driven problems. Neuroscience claims must be stated as what the cited papers show; keep the models
honest and small. Prose for an expert reader; no review-article filler.
1. Linearization: rate network $\tau\dot r = -r + W\phi(r) + u(t)$; fixed points; Jacobian $J = (-I + WD)/\tau$ with
   $D = \diag\phi'(r^*)$; Hartman–Grobman (state, cite Perko); slow points in trained recurrent neural networks (RNNs)
   (Sussillo and Barak, Neural Comput., 2013; Mante, Sussillo, Shenoy and Newsome, Nature, 2013).
2. Non-normal amplification in excitatory and inhibitory (E/I) networks: balanced amplification (Murphy and Miller,
   Neuron, 2009): two-population model, Schur basis of sum and difference modes, feedforward coupling from difference to
   sum; stability-optimized circuits (SOC, Hennequin, Vogels and Gerstner, Neuron, 2014). Derive what you claim for the
   2×2 model.
3. Memory: line attractors (Seung, PNAS, 1996): an eigenvalue of $W$ at 1 gives a zero eigenvalue of $J$ and persistent
   activity; mistuning gives the effective time constant $\tau/\abs{1-\lambda}$ (derive); feedforward memory in
   non-normal chains (Goldman, Neuron, 2009); memory traces (Ganguli, Huh and Sompolinsky, PNAS, 2008), one sentence.
4. Random connectivity: circular law for $W_{ij}$ i.i.d. with variance $g^2/N$ (state, cite); linear instability of
   $-I + W$ when $g > 1$; Dale's law and balanced E/I structure (Rajan and Abbott, Phys. Rev. Lett., 2006); the
   transition to chaos in nonlinear networks (Sompolinsky, Crisanti and Sommers, Phys. Rev. Lett., 1988), one paragraph.
5. Control-theoretic views of neural circuits: optimal feedback control (Todorov and Jordan, 2002); preparatory activity
   as setting an initial condition (Churchland et al., Nature, 2012; Shenoy, Sahani and Churchland, Annu. Rev.
   Neurosci., 2013; Kao, Sadabadi and Hennequin, Neuron, 2021); network control of brain networks and its caveats (Gu et
   al., Nat. Commun., 2015; Pasqualetti et al., 2014; Tu et al., NeuroImage, 2018); spike-coding networks implementing a
   linear dynamical system (Boerlin, Machens and Denève, PLoS Comput. Biol., 2013); internal feedback under delays and
   system level synthesis (SLS) (Li, Sarma, Sejnowski and Doyle, PNAS, 2023; Anderson, Doyle, Low and Matni, 2019) with
   the SLS achievability constraint $[zI - A,\ -B]\begin{bmatrix}\Phi_x\\ \Phi_u\end{bmatrix} = I$ explained.
6. Linear methods beyond linear systems: the Koopman operator (linear, infinite-dimensional, acts on observables);
   dynamic mode decomposition (DMD) as least squares $A \approx X'X^+$ (link chapters 2 and 4; Schmid, J. Fluid Mech.,
   2010; Brunton, Budišić, Kaiser and Kutz, SIAM Rev., 2022); what DMD can and cannot recover.
Visuals: (a) balanced amplification: two-population model with strength $w$ and inhibition-dominance $k$; eigenvalues,
Schur vectors, trajectories of $r_E, r_I$ from a difference-mode kick, peak amplification versus $w$, compared with a
normal network with the same eigenvalues; (b) integrators and memory: one recurrent mode with eigenvalue $\lambda \in
[0.8, 1.2]$ receiving pulses (persistent, leaky, runaway), and a toggle for a feedforward chain of length 6 showing
transient memory; (c) random-matrix spectra: $N$ (50–300), $g$, Dale's-law toggle with excitatory fraction and balance;
eigenvalue scatter against the circle of radius $g$; rightmost eigenvalue and stability of $-I + W$; (d) DMD as least
squares: noisy snapshots of a known 2D linear system, estimated eigenvalues versus true as noise grows, reconstructed
trajectory.
Readings: Dayan and Abbott ch. 7; the papers above; Brunton and Kutz ch. 7; Trefethen and Embree (non-normal dynamics);
Kao and Hennequin, "Neuroscience out of control: control-theoretic perspectives on neural circuit dynamics" (Curr.
Opin. Neurobiol., 2019).

## 11. Verification and definition of done

For each page you write:

1. `node tools/check.js <page>.html --shots --dark --mobile` from `/home/claude/linear_theory`. It must report zero
   errors. Treat every warning seriously: abbreviation warnings must be fixed; a canvas "no coloured marks" warning means
   a broken or empty plot unless the figure is deliberately monochrome.
2. Look at every screenshot it writes in `tools/shots/` (light and dark) with the Read tool. Fix overlapping labels,
   clipped text, empty plots, unreadable colours, layouts that break at phone width.
3. Check each widget's numbers against hand calculations for at least one preset (e.g. a known eigenvalue, a known
   Gramian, a known Riccati solution); the library is tested, but your use of it may not be.
4. Re-read the prose against §2: every symbol defined at first use on the page, every abbreviation expanded, no em
   dashes, math in math mode, theorems stated with hypotheses, proofs correct, cross-references via `a.xref`.
5. Mathematical correctness is the top priority. Prefer stating less over stating something false.
6. Claims audit (§2 rule 11, §4.1): every general claim outside a numbered block is one of: promoted to a block, an
   in-place computation on a specified example, a restatement with an `a.xref`, a linked fact from another chapter,
   or a heuristic marked as such in a Remark.
7. `python3 tools/check_links.py` reports no broken cross-page links (every `page.html#id` names an existing id).

Report back (concisely): files written; counts from the checker; each visual and what it demonstrates; any statements
you were unsure of; new abbreviations or symbols to add to the global glossary and notation page; any library or CSS
needs.
