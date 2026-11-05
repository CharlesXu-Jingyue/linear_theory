# Linear Theory: interactive study guide

A personal study guide for linear theory: a fast refresher of finite-dimensional linear algebra, then linear analysis,
linear dynamical systems and control (controllability, feedback, LQR, Kalman filtering, robustness, model reduction),
and a bridge chapter on neural circuit dynamics. Every chapter follows the same inquiry loop (problem, assumptions,
goal, probes, counterexamples, patterns, theorem, proof, visual) and carries interactive figures computed live. Every
general claim is stated as a numbered Theorem, Proposition, Lemma or Corollary with a proof or a precise source.

## Open it

Open `index.html` in a browser. Fonts (Google Fonts) and math (MathJax 3.2.2 from jsDelivr) load from the web; without
a connection the pages still work but show raw TeX and fallback fonts.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | hub: hero figure, how chapters work, curriculum cards |
| `ch01_linear_maps.html` to `ch13_neural_bridges.html` | the thirteen chapters |
| `notation.html` | global notation, deliberate collisions, abbreviations |
| `assets/lt.js` | runtime: numerics (eigen, SVD, Schur, expm, Lyapunov, Riccati, pseudospectra), systems helpers, canvas plotting with draggable handles, UI controls, page shell |
| `assets/lt.css` | design system (light and dark themes) |
| `assets/toc.js` | table of contents and abbreviation glossary |
| `SPEC.md` | authoring spec: rules, markup vocabulary, runtime API, chapter plans |
| `tools/test_lt.js` | numerical tests for `assets/lt.js` (`node tools/test_lt.js`) |
| `tools/check.js` | page checker: TeX errors, console errors, overflow, unexpanded abbreviations, em dashes, duplicate ids, unlabeled blocks, numbered statements without a proof or source, screenshots |
| `tools/check_links.py` | cross-page link checker: every `page.html#id` link must name an existing id (`python3 tools/check_links.py`) |

## Extend it

Add or revise a chapter by following `SPEC.md` and copying the structure of `ch01_linear_maps.html`. To run the
checker: `cd tools && npm install playwright mathjax@3.2.2 && npx playwright install chromium`, then from the repository
root `node tools/check.js ch05_hilbert_spaces.html --shots --dark --mobile` (screenshots land in `tools/shots/`).

The curriculum, textbook survey and pacing live in the companion Claude doc "Linear Theory for Control and Dynamics:
Curriculum".
