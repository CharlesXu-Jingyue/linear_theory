/* Linear Theory study guide: shared runtime (lt.js)
   Plain ES2019, no dependencies. Exposes window.LT.

   Sections
     1. MathJax configuration (set before MathJax loads)
     2. Numerics: real and complex dense linear algebra, Lyapunov and Riccati solvers
     3. Systems helpers: frequency response, discretization, Gramians, pole placement, polynomials
     4. Theme tokens (light and dark), colour maps
     5. Plot: canvas plotting in world coordinates, with draggable handles
     6. UI controls: sliders, selects, toggles, buttons, readouts, matrix display
     7. Page shell: navigation, numbering of sections, blocks and visuals, cross-references
*/
(function (root) {
  'use strict';
  const hasDOM = typeof document !== 'undefined';
  const EPS = 2.220446049250313e-16;

  /* ------------------------------------------------------------------ *
   * 1. MathJax configuration
   * ------------------------------------------------------------------ */
  if (hasDOM && !root.MathJax) {
    root.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        tags: 'none',
        macros: {
          R: '\\mathbb{R}', C: '\\mathbb{C}', F: '\\mathbb{F}', Z: '\\mathbb{Z}',
          Null: '\\mathcal{N}', Range: '\\mathcal{R}',
          tr: '\\operatorname{tr}', rank: '\\operatorname{rank}', diag: '\\operatorname{diag}',
          spn: '\\operatorname{span}', Re: '\\operatorname{Re}', Im: '\\operatorname{Im}',
          T: '{\\top}', eps: '\\varepsilon', dd: '\\mathrm{d}',
          inner: ['\\langle #1,\\, #2\\rangle', 2],
          norm: ['\\lVert #1\\rVert', 1],
          abs: ['\\lvert #1\\rvert', 1]
        }
      },
      svg: { fontCache: 'global' },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'canvas', 'select', 'option'],
        ignoreHtmlClass: 'no-math'
      },
      startup: {
        pageReady: function () {
          return root.MathJax.startup.defaultPageReady().then(function () {
            root.__LT_MATH_DONE = true;
            document.documentElement.classList.add('mj-ready');
            document.dispatchEvent(new CustomEvent('lt:math'));
          });
        }
      }
    };
  }

  /* ------------------------------------------------------------------ *
   * 2. Numerics. Matrices are arrays of rows; vectors are plain arrays.
   * ------------------------------------------------------------------ */
  const M = {};
  M.zeros = (m, n) => { const A = new Array(m); for (let i = 0; i < m; i++) A[i] = new Array(n).fill(0); return A; };
  M.eye = n => { const A = M.zeros(n, n); for (let i = 0; i < n; i++) A[i][i] = 1; return A; };
  M.clone = A => A.map(r => r.slice());
  M.T = A => { const m = A.length, n = A[0].length, B = M.zeros(n, m); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) B[j][i] = A[i][j]; return B; };
  M.add = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  M.sub = (A, B) => A.map((r, i) => r.map((v, j) => v - B[i][j]));
  M.scale = (A, s) => A.map(r => r.map(v => v * s));
  M.mul = (A, B) => {
    const m = A.length, k = B.length, n = B[0].length, C = M.zeros(m, n);
    for (let i = 0; i < m; i++) {
      const Ai = A[i], Ci = C[i];
      for (let p = 0; p < k; p++) { const a = Ai[p]; if (a === 0) continue; const Bp = B[p]; for (let j = 0; j < n; j++) Ci[j] += a * Bp[j]; }
    }
    return C;
  };
  M.mv = (A, x) => A.map(r => { let s = 0; for (let j = 0; j < r.length; j++) s += r[j] * x[j]; return s; });
  M.dot = (x, y) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * y[i]; return s; };
  M.vnorm = x => Math.sqrt(M.dot(x, x));
  M.vadd = (x, y) => x.map((v, i) => v + y[i]);
  M.vsub = (x, y) => x.map((v, i) => v - y[i]);
  M.vscale = (x, s) => x.map(v => v * s);
  M.unit = x => { const n = M.vnorm(x); return n > 0 ? x.map(v => v / n) : x.slice(); };
  M.outer = (x, y) => x.map(a => y.map(b => a * b));
  M.diag = v => { const A = M.zeros(v.length, v.length); v.forEach((x, i) => { A[i][i] = x; }); return A; };
  M.diagOf = A => A.map((r, i) => r[i]);
  M.trace = A => { let s = 0; for (let i = 0; i < A.length; i++) s += A[i][i]; return s; };
  M.col = (A, j) => A.map(r => r[j]);
  M.fromCols = cols => { const m = cols[0].length, n = cols.length, A = M.zeros(m, n); for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) A[i][j] = cols[j][i]; return A; };
  M.block = (A, i0, j0, m, n) => { const B = M.zeros(m, n); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) B[i][j] = A[i0 + i][j0 + j]; return B; };
  M.blocks = rows => { // [[A, B], [C, D]] -> one matrix
    const out = [];
    rows.forEach(rowBlocks => {
      const h = rowBlocks[0].length;
      for (let i = 0; i < h; i++) { let r = []; rowBlocks.forEach(B => { r = r.concat(B[i]); }); out.push(r); }
    });
    return out;
  };
  M.sym = A => A.map((r, i) => r.map((v, j) => 0.5 * (v + A[j][i])));
  M.normFro = A => { let s = 0; for (const r of A) for (const v of r) s += v * v; return Math.sqrt(s); };
  M.norm1 = A => { const n = A[0].length; let mx = 0; for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < A.length; i++) s += Math.abs(A[i][j]); if (s > mx) mx = s; } return mx; };
  M.normInf = A => { let mx = 0; for (const r of A) { let s = 0; for (const v of r) s += Math.abs(v); if (s > mx) mx = s; } return mx; };
  M.kron = (A, B) => { const m = A.length, n = A[0].length, p = B.length, q = B[0].length, K = M.zeros(m * p, n * q); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) for (let k = 0; k < p; k++) for (let l = 0; l < q; l++) K[i * p + k][j * q + l] = A[i][j] * B[k][l]; return K; };
  M.rot = th => [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]];

  /* LU with partial pivoting (P A = L U). */
  M.lu = A => {
    const n = A.length, LU = M.clone(A), piv = []; let sign = 1, singular = false;
    for (let i = 0; i < n; i++) piv.push(i);
    for (let k = 0; k < n; k++) {
      let p = k, mx = Math.abs(LU[k][k]);
      for (let i = k + 1; i < n; i++) { const v = Math.abs(LU[i][k]); if (v > mx) { mx = v; p = i; } }
      if (mx === 0) { singular = true; continue; }
      if (p !== k) { const t = LU[p]; LU[p] = LU[k]; LU[k] = t; const s = piv[p]; piv[p] = piv[k]; piv[k] = s; sign = -sign; }
      const Lk = LU[k], d = Lk[k];
      for (let i = k + 1; i < n; i++) {
        const Li = LU[i], f = Li[k] / d; if (f === 0) continue; Li[k] = f;
        for (let j = k + 1; j < n; j++) Li[j] -= f * Lk[j];
      }
    }
    return { LU, piv, sign, singular };
  };
  M.luSolve = (F, b) => {
    const { LU, piv } = F, n = LU.length, x = new Array(n);
    for (let i = 0; i < n; i++) { let s = b[piv[i]]; const Li = LU[i]; for (let j = 0; j < i; j++) s -= Li[j] * x[j]; x[i] = s; }
    for (let i = n - 1; i >= 0; i--) { let s = x[i]; const Ui = LU[i]; for (let j = i + 1; j < n; j++) s -= Ui[j] * x[j]; x[i] = s / Ui[i]; }
    return x;
  };
  M.det = A => { const F = M.lu(A); let d = F.sign; for (let i = 0; i < A.length; i++) d *= F.LU[i][i]; return d; };
  M.logAbsDet = A => { const F = M.lu(A); let s = 0; for (let i = 0; i < A.length; i++) s += Math.log(Math.abs(F.LU[i][i])); return s; };
  M.solve = (A, b) => {
    const F = M.lu(A);
    if (Array.isArray(b[0])) { const cols = []; for (let j = 0; j < b[0].length; j++) cols.push(M.luSolve(F, M.col(b, j))); return M.fromCols(cols); }
    return M.luSolve(F, b);
  };
  M.inv = A => M.solve(A, M.eye(A.length));
  M.lstsq = (A, b) => M.solve(M.mul(M.T(A), A), Array.isArray(b[0]) ? M.mul(M.T(A), b) : M.mv(M.T(A), b));

  /* Householder QR: A (m x n, m >= n) = Q R, Q m x m orthogonal, R m x n upper triangular. */
  M.qr = A0 => {
    const m = A0.length, n = A0[0].length, R = M.clone(A0), Q = M.eye(m);
    for (let k = 0; k < Math.min(m - 1, n); k++) {
      let a = 0; for (let i = k; i < m; i++) a += R[i][k] * R[i][k]; a = Math.sqrt(a);
      if (a < 1e-300) continue; if (R[k][k] > 0) a = -a;
      const v = new Array(m).fill(0); v[k] = R[k][k] - a; for (let i = k + 1; i < m; i++) v[i] = R[i][k];
      let vn = 0; for (let i = k; i < m; i++) vn += v[i] * v[i]; if (vn < 1e-300) continue;
      for (let j = 0; j < n; j++) { let s = 0; for (let i = k; i < m; i++) s += v[i] * R[i][j]; s = 2 * s / vn; for (let i = k; i < m; i++) R[i][j] -= s * v[i]; }
      for (let i = 0; i < m; i++) { let s = 0; for (let j = k; j < m; j++) s += Q[i][j] * v[j]; s = 2 * s / vn; for (let j = k; j < m; j++) Q[i][j] -= s * v[j]; }
    }
    for (let i = 0; i < m; i++) for (let j = 0; j < Math.min(i, n); j++) R[i][j] = 0;
    return { Q, R };
  };

  /* Cholesky A = L L^T for symmetric positive definite A. Returns null if A is not positive definite. */
  M.chol = A => {
    const n = A.length, L = M.zeros(n, n);
    for (let j = 0; j < n; j++) {
      let s = A[j][j]; for (let k = 0; k < j; k++) s -= L[j][k] * L[j][k];
      if (!(s > 0)) return null; L[j][j] = Math.sqrt(s);
      for (let i = j + 1; i < n; i++) { let t = A[i][j]; for (let k = 0; k < j; k++) t -= L[i][k] * L[j][k]; L[i][j] = t / L[j][j]; }
    }
    return L;
  };

  /* Symmetric eigendecomposition by cyclic Jacobi. Values sorted descending; vectors are the columns of V. */
  M.eigSym = A0 => {
    const n = A0.length, A = M.sym(A0), V = M.eye(n);
    const scale = M.normFro(A) || 1;
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (Math.sqrt(off) < 1e-15 * scale) break;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        const apq = A[p][q]; if (Math.abs(apq) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * apq);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = []; for (let i = 0; i < n; i++) idx.push(i);
    idx.sort((a, b) => A[b][b] - A[a][a]);
    return { values: idx.map(i => A[i][i]), vectors: M.fromCols(idx.map(i => M.col(V, i))) };
  };

  /* Orthonormal completion: given orthonormal columns (m x k, possibly with zero columns), return m x m orthogonal. */
  M.completeBasis = (Ucols, m) => {
    const basis = [];
    Ucols.forEach(u => { if (M.vnorm(u) > 0.5) basis.push(u.slice()); });
    for (let e = 0; e < m && basis.length < m; e++) {
      let v = new Array(m).fill(0); v[e] = 1;
      for (let pass = 0; pass < 2; pass++) for (const b of basis) { const d = M.dot(v, b); v = v.map((x, i) => x - d * b[i]); }
      const nv = M.vnorm(v); if (nv > 1e-8) basis.push(v.map(x => x / nv));
    }
    return basis;
  };

  /* SVD by one-sided Jacobi (Hestenes). Returns thin U (m x r), S (r, descending), V (n x r), r = min(m, n).
     With {full: true} returns square U (m x m) and V (n x n), S still of length min(m, n). */
  M.svd = (A0, opt) => {
    opt = opt || {};
    let A = A0, transposed = false;
    if (A.length < A[0].length) { A = M.T(A); transposed = true; }
    const m = A.length, n = A[0].length, U = M.clone(A), V = M.eye(n);
    const tol = 1e-15;
    for (let sweep = 0; sweep < 80; sweep++) {
      let rotated = false;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        let alpha = 0, beta = 0, gamma = 0;
        for (let i = 0; i < m; i++) { const up = U[i][p], uq = U[i][q]; alpha += up * up; beta += uq * uq; gamma += up * uq; }
        if (gamma === 0 || Math.abs(gamma) <= tol * Math.sqrt(alpha * beta)) continue;
        rotated = true;
        const zeta = (beta - alpha) / (2 * gamma);
        const t = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const c = 1 / Math.sqrt(1 + t * t), s = c * t;
        for (let i = 0; i < m; i++) { const up = U[i][p], uq = U[i][q]; U[i][p] = c * up - s * uq; U[i][q] = s * up + c * uq; }
        for (let i = 0; i < n; i++) { const vp = V[i][p], vq = V[i][q]; V[i][p] = c * vp - s * vq; V[i][q] = s * vp + c * vq; }
      }
      if (!rotated) break;
    }
    const S0 = []; for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < m; i++) s += U[i][j] * U[i][j]; S0.push(Math.sqrt(s)); }
    const idx = []; for (let j = 0; j < n; j++) idx.push(j);
    idx.sort((a, b) => S0[b] - S0[a]);
    const S = idx.map(j => S0[j]);
    const smax = S[0] || 1;
    let Ucols = idx.map(j => { const s = S0[j]; return U.map(r => (s > 1e-13 * smax ? r[j] / s : 0)); });
    let Vcols = idx.map(j => M.col(V, j));
    if (opt.full || Ucols.some(u => M.vnorm(u) < 0.5)) {
      const full = M.completeBasis(Ucols, m);
      // keep the columns that were already good, fill in the zero ones from the completion
      let extra = full.filter(b => !Ucols.some(u => M.vnorm(u) > 0.5 && Math.abs(M.dot(u, b)) > 1 - 1e-9));
      Ucols = Ucols.map(u => (M.vnorm(u) > 0.5 ? u : extra.shift()));
      if (opt.full) Ucols = Ucols.concat(extra);
    }
    const Um = M.fromCols(Ucols), Vm = M.fromCols(Vcols);
    if (transposed) {
      if (opt.full) {
        // A0 = (A)^T = V S U^T. Square factors: left = V completed to size n0 = m0? A0 is (n x m) here.
        const Vfull = M.fromCols(M.completeBasis(Vcols, n));
        return { U: Vfull, S, V: Um };
      }
      return { U: Vm, S, V: Um };
    }
    if (opt.full) return { U: Um, S, V: M.fromCols(M.completeBasis(Vcols, n)) };
    return { U: Um, S, V: Vm };
  };
  M.rank = (A, tol) => { const S = M.svd(A).S; const t = tol != null ? tol : Math.max(A.length, A[0].length) * (S[0] || 0) * 1e-12; return S.filter(s => s > t).length; };
  M.norm2 = A => M.svd(A).S[0] || 0;
  M.cond = A => { const S = M.svd(A).S; return S[0] / S[S.length - 1]; };
  M.pinv = (A, tol) => {
    const { U, S, V } = M.svd(A); const t = tol != null ? tol : Math.max(A.length, A[0].length) * (S[0] || 0) * 1e-12;
    const r = S.length, m = A.length, n = A[0].length, P = M.zeros(n, m);
    for (let k = 0; k < r; k++) { if (S[k] <= t) continue; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) P[i][j] += V[i][k] * U[j][k] / S[k]; }
    return P;
  };

  /* Hessenberg reduction A = Q H Q^T by Householder reflections. */
  M.hess = A0 => {
    const n = A0.length, H = M.clone(A0), Q = M.eye(n);
    for (let k = 0; k < n - 2; k++) {
      let alpha = 0; for (let i = k + 1; i < n; i++) alpha += H[i][k] * H[i][k];
      alpha = Math.sqrt(alpha); if (alpha < 1e-300) continue;
      if (H[k + 1][k] > 0) alpha = -alpha;
      const v = new Array(n).fill(0); v[k + 1] = H[k + 1][k] - alpha; for (let i = k + 2; i < n; i++) v[i] = H[i][k];
      let vn = 0; for (let i = k + 1; i < n; i++) vn += v[i] * v[i]; if (vn < 1e-300) continue;
      for (let j = 0; j < n; j++) { let s = 0; for (let i = k + 1; i < n; i++) s += v[i] * H[i][j]; s = 2 * s / vn; if (s !== 0) for (let i = k + 1; i < n; i++) H[i][j] -= s * v[i]; }
      for (let i = 0; i < n; i++) { let s = 0; for (let j = k + 1; j < n; j++) s += H[i][j] * v[j]; s = 2 * s / vn; if (s !== 0) for (let j = k + 1; j < n; j++) H[i][j] -= s * v[j]; }
      for (let i = 0; i < n; i++) { let s = 0; for (let j = k + 1; j < n; j++) s += Q[i][j] * v[j]; s = 2 * s / vn; if (s !== 0) for (let j = k + 1; j < n; j++) Q[i][j] -= s * v[j]; }
      for (let i = k + 2; i < n; i++) H[i][k] = 0;
    }
    return { H, Q };
  };

  function csqrt(re, im) {
    const r = Math.hypot(re, im); if (r === 0) return [0, 0];
    let sr = Math.sqrt((r + Math.abs(re)) / 2), si = im / (2 * sr);
    if (re < 0) { const t = Math.abs(si); si = im >= 0 ? sr : -sr; sr = t; }
    return [sr, si];
  }

  /* Complex Schur form of a real matrix: A = Q T Q^*, T upper triangular (complex), Q unitary.
     Explicit single-shift QR with Wilkinson shifts on the Hessenberg form.
     opt.full === false gives eigenvalues only (faster, T and Q not consistent). */
  M.schur = (A0, opt) => {
    opt = opt || {};
    const n = A0.length, full = opt.full !== false;
    const { H, Q } = full ? M.hess(A0) : { H: M.hess(A0).H, Q: null };
    const Tr = H.map(r => Float64Array.from(r)), Ti = H.map(() => new Float64Array(n));
    const Qr = full ? Q.map(r => Float64Array.from(r)) : null, Qi = full ? Q.map(() => new Float64Array(n)) : null;
    let anorm = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) anorm += Tr[i][j] * Tr[i][j];
    anorm = Math.sqrt(anorm) || 1;
    let hi = n - 1, iter = 0, total = 0;
    while (hi > 0) {
      let l = hi;
      for (; l > 0; l--) {
        let s = Math.hypot(Tr[l - 1][l - 1], Ti[l - 1][l - 1]) + Math.hypot(Tr[l][l], Ti[l][l]);
        if (s === 0) s = anorm;
        if (Math.hypot(Tr[l][l - 1], Ti[l][l - 1]) <= EPS * s) { Tr[l][l - 1] = 0; Ti[l][l - 1] = 0; break; }
      }
      if (l === hi) { hi--; iter = 0; continue; }
      iter++; total++;
      if (total > 60 * n + 200) break;
      const ar = Tr[hi - 1][hi - 1], ai = Ti[hi - 1][hi - 1], br = Tr[hi - 1][hi], bi = Ti[hi - 1][hi];
      const cr = Tr[hi][hi - 1], ci = Ti[hi][hi - 1], dr = Tr[hi][hi], di = Ti[hi][hi];
      let mur, mui;
      if (iter % 11 === 10) { const c = Math.hypot(cr, ci); mur = dr + 0.75 * c; mui = di + 0.35 * c; }
      else {
        const hr = (ar - dr) / 2, hm = (ai - di) / 2;
        const qr = hr * hr - hm * hm + (br * cr - bi * ci), qi = 2 * hr * hm + (br * ci + bi * cr);
        const sq = csqrt(qr, qi), mr = (ar + dr) / 2, mi = (ai + di) / 2;
        const e1r = mr + sq[0], e1i = mi + sq[1], e2r = mr - sq[0], e2i = mi - sq[1];
        if (Math.hypot(e1r - dr, e1i - di) < Math.hypot(e2r - dr, e2i - di)) { mur = e1r; mui = e1i; } else { mur = e2r; mui = e2i; }
      }
      for (let k = l; k <= hi; k++) { Tr[k][k] -= mur; Ti[k][k] -= mui; }
      const rc = [], rsr = [], rsi = [];
      const jEnd = full ? n - 1 : hi;
      for (let k = l; k < hi; k++) {
        const xr = Tr[k][k], xi = Ti[k][k], yr = Tr[k + 1][k], yi = Ti[k + 1][k];
        const nx = Math.hypot(xr, xi), ny = Math.hypot(yr, yi);
        let c, sr, si;
        if (ny === 0) { c = 1; sr = 0; si = 0; }
        else if (nx === 0) { c = 0; sr = yr / ny; si = -yi / ny; }
        else { const r = Math.hypot(nx, ny), ur = xr / nx, ui = xi / nx; c = nx / r; sr = (ur * yr + ui * yi) / r; si = (ui * yr - ur * yi) / r; }
        rc.push(c); rsr.push(sr); rsi.push(si);
        const Rk = Tr[k], Ik = Ti[k], Rk1 = Tr[k + 1], Ik1 = Ti[k + 1];
        for (let j = k; j <= jEnd; j++) {
          const a_r = Rk[j], a_i = Ik[j], b_r = Rk1[j], b_i = Ik1[j];
          Rk[j] = c * a_r + (sr * b_r - si * b_i); Ik[j] = c * a_i + (sr * b_i + si * b_r);
          Rk1[j] = -(sr * a_r + si * a_i) + c * b_r; Ik1[j] = -(sr * a_i - si * a_r) + c * b_i;
        }
      }
      for (let t = 0; t < rc.length; t++) {
        const k = l + t, c = rc[t], sr = rsr[t], si = rsi[t];
        const iStart = full ? 0 : l, iEnd = Math.min(k + 2, hi);
        for (let i = iStart; i <= iEnd; i++) {
          const a_r = Tr[i][k], a_i = Ti[i][k], b_r = Tr[i][k + 1], b_i = Ti[i][k + 1];
          Tr[i][k] = c * a_r + (b_r * sr + b_i * si); Ti[i][k] = c * a_i + (b_i * sr - b_r * si);
          Tr[i][k + 1] = -(a_r * sr - a_i * si) + c * b_r; Ti[i][k + 1] = -(a_r * si + a_i * sr) + c * b_i;
        }
        if (full) for (let i = 0; i < n; i++) {
          const a_r = Qr[i][k], a_i = Qi[i][k], b_r = Qr[i][k + 1], b_i = Qi[i][k + 1];
          Qr[i][k] = c * a_r + (b_r * sr + b_i * si); Qi[i][k] = c * a_i + (b_i * sr - b_r * si);
          Qr[i][k + 1] = -(a_r * sr - a_i * si) + c * b_r; Qi[i][k + 1] = -(a_r * si + a_i * sr) + c * b_i;
        }
      }
      for (let k = l; k <= hi; k++) { Tr[k][k] += mur; Ti[k][k] += mui; }
    }
    const values = [];
    for (let i = 0; i < n; i++) {
      let re = Tr[i][i], im = Ti[i][i];
      if (Math.abs(im) < 1e-12 * anorm) im = 0;
      values.push({ re, im });
    }
    return { Tr, Ti, Qr, Qi, values };
  };

  /* Eigenvalues (complex) of a real square matrix, sorted by real part descending, then imaginary part. */
  M.eigvals = A => {
    if (A.length === 1) return [{ re: A[0][0], im: 0 }];
    if (A.length === 2) return M.eig2(A).values;
    const v = M.schur(A, { full: false }).values;
    return v.sort((a, b) => (b.re - a.re) || (b.im - a.im));
  };

  /* Eigenvalues and eigenvectors of a real square matrix.
     Returns {values: [{re, im}], vectors: [{re: [...], im: [...]}]} with unit-norm vectors.
     Eigenvectors come from back-substitution in the Schur form; for defective matrices the computed
     vectors for a repeated eigenvalue are (numerically) parallel, which is the honest answer. */
  M.eig = A => {
    const n = A.length, S = M.schur(A, { full: true }), Tr = S.Tr, Ti = S.Ti;
    let tn = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tn += Tr[i][j] * Tr[i][j] + Ti[i][j] * Ti[i][j];
    const small = Math.sqrt(tn) * 1e-14 || 1e-300;
    const out = [];
    for (let k = 0; k < n; k++) {
      const lr = Tr[k][k], li = Ti[k][k];
      const yr = new Float64Array(n), yi = new Float64Array(n); yr[k] = 1;
      for (let i = k - 1; i >= 0; i--) {
        let sr = 0, si = 0;
        for (let j = i + 1; j <= k; j++) { sr += Tr[i][j] * yr[j] - Ti[i][j] * yi[j]; si += Tr[i][j] * yi[j] + Ti[i][j] * yr[j]; }
        let dr = Tr[i][i] - lr, di = Ti[i][i] - li;
        if (Math.hypot(dr, di) < small) { dr = small; di = 0; }
        const den = dr * dr + di * di;
        yr[i] = -(sr * dr + si * di) / den; yi[i] = -(si * dr - sr * di) / den;
      }
      const xr = new Array(n).fill(0), xi = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j <= k; j++) {
        xr[i] += S.Qr[i][j] * yr[j] - S.Qi[i][j] * yi[j];
        xi[i] += S.Qr[i][j] * yi[j] + S.Qi[i][j] * yr[j];
      }
      let nrm = 0, big = 0, bi = 0;
      for (let i = 0; i < n; i++) { const m2 = xr[i] * xr[i] + xi[i] * xi[i]; nrm += m2; if (m2 > big) { big = m2; bi = i; } }
      nrm = Math.sqrt(nrm);
      const pr = xr[bi], pi = xi[bi], pm = Math.hypot(pr, pi) || 1;
      const cr = pr / pm, ci = -pi / pm; // multiply by conj phase so the largest entry is real positive
      const vr = [], vi = [];
      for (let i = 0; i < n; i++) { vr.push((xr[i] * cr - xi[i] * ci) / nrm); vi.push((xr[i] * ci + xi[i] * cr) / nrm); }
      out.push({ value: S.values[k], vec: { re: vr, im: vi } });
    }
    out.sort((a, b) => (b.value.re - a.value.re) || (b.value.im - a.value.im));
    return { values: out.map(o => o.value), vectors: out.map(o => o.vec), schur: S };
  };

  /* 2 x 2 closed form. values: complex; vectors: unit real eigenvectors when real (null if A = lambda I). */
  M.eig2 = A => {
    const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
    const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
    const ev = l => {
      const r1 = [a - l, b], r2 = [c, d - l];
      const n1 = Math.hypot(r1[0], r1[1]), n2 = Math.hypot(r2[0], r2[1]);
      const sc = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d), 1e-300);
      if (n1 < 1e-12 * sc && n2 < 1e-12 * sc) return null;
      const v = n1 >= n2 ? [-r1[1], r1[0]] : [-r2[1], r2[0]];
      const nv = Math.hypot(v[0], v[1]); let u = [v[0] / nv, v[1] / nv];
      if (u[0] < -1e-12 || (Math.abs(u[0]) <= 1e-12 && u[1] < 0)) u = [-u[0], -u[1]];
      return u;
    };
    if (disc >= 0) {
      const s = Math.sqrt(disc), l1 = tr / 2 + s, l2 = tr / 2 - s;
      return { real: true, tr, det, disc, values: [{ re: l1, im: 0 }, { re: l2, im: 0 }], vectors: [ev(l1), ev(l2)] };
    }
    const s = Math.sqrt(-disc);
    return { real: false, tr, det, disc, values: [{ re: tr / 2, im: s }, { re: tr / 2, im: -s }], vectors: [null, null] };
  };

  M.spectralRadius = A => Math.max(...M.eigvals(A).map(z => Math.hypot(z.re, z.im)));
  M.spectralAbscissa = A => Math.max(...M.eigvals(A).map(z => z.re));
  M.numericalAbscissa = A => M.eigSym(M.sym(A)).values[0];

  /* Matrix exponential: scaling and squaring with a (6,6) Pade approximant. */
  M.expm = A => {
    const n = A.length, nrm = M.norm1(A);
    let s = 0; if (nrm > 0.5) s = Math.max(0, Math.ceil(Math.log2(nrm / 0.5)));
    const As = M.scale(A, 1 / Math.pow(2, s));
    const c = [1, 0.5, 5 / 44, 1 / 66, 1 / 792, 1 / 15840, 1 / 665280];
    let X = M.eye(n), N = M.eye(n), D = M.eye(n);
    for (let k = 1; k <= 6; k++) { X = M.mul(As, X); const cX = M.scale(X, c[k]); N = M.add(N, cX); D = (k % 2) ? M.sub(D, cX) : M.add(D, cX); }
    let E = M.solve(D, N);
    for (let k = 0; k < s; k++) E = M.mul(E, E);
    return E;
  };

  /* Continuous Lyapunov equation A X + X A^T + Q = 0 (Kronecker solve; fine for n <= 20). */
  M.lyap = (A, Q) => {
    const n = A.length, N = n * n, K = M.zeros(N, N), q = new Array(N);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p = i + j * n; q[p] = -Q[i][j];
      for (let k = 0; k < n; k++) { K[p][k + j * n] += A[i][k]; K[p][i + k * n] += A[j][k]; }
    }
    const x = M.solve(K, q), X = M.zeros(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) X[i][j] = x[i + j * n];
    return M.sym(X);
  };
  /* Discrete Lyapunov equation A X A^T - X + Q = 0. */
  M.dlyap = (A, Q) => {
    const n = A.length, N = n * n, K = M.zeros(N, N), q = new Array(N);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p = i + j * n; q[p] = -Q[i][j]; K[p][p] -= 1;
      for (let l = 0; l < n; l++) for (let k = 0; k < n; k++) K[p][k + l * n] += A[i][k] * A[j][l];
    }
    const x = M.solve(K, q), X = M.zeros(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) X[i][j] = x[i + j * n];
    return M.sym(X);
  };

  /* Continuous algebraic Riccati equation A^T P + P A - P B R^{-1} B^T P + Q = 0.
     Matrix sign function of the Hamiltonian, then Newton-Kleinman refinement. Returns the stabilizing P. */
  M.care = (A, B, Q, R) => {
    const n = A.length, Ri = M.inv(R), G = M.mul(M.mul(B, Ri), M.T(B));
    let Z = M.blocks([[A, M.scale(G, -1)], [M.scale(Q, -1), M.scale(M.T(A), -1)]]);
    for (let it = 0; it < 100; it++) {
      const Zi = M.inv(Z), c = Math.exp(M.logAbsDet(Z) / (2 * n)) || 1;
      const Zn = M.scale(M.add(M.scale(Z, 1 / c), M.scale(Zi, c)), 0.5);
      const d = M.norm1(M.sub(Zn, Z)); Z = Zn;
      if (d < 1e-13 * M.norm1(Z)) break;
    }
    const I = M.eye(n);
    const W11 = M.block(Z, 0, 0, n, n), W12 = M.block(Z, 0, n, n, n), W21 = M.block(Z, n, 0, n, n), W22 = M.block(Z, n, n, n, n);
    const L = M.blocks([[W12], [M.add(W22, I)]]), Rh = M.scale(M.blocks([[M.add(W11, I)], [W21]]), -1);
    let P = M.sym(M.solve(M.mul(M.T(L), L), M.mul(M.T(L), Rh)));
    for (let it = 0; it < 4; it++) {
      const K = M.mul(Ri, M.mul(M.T(B), P)), Acl = M.sub(A, M.mul(B, K));
      const Pn = M.lyap(M.T(Acl), M.add(Q, M.mul(M.T(K), M.mul(R, K))));
      const d = M.normFro(M.sub(Pn, P)); P = Pn;
      if (d < 1e-14 * (1 + M.normFro(P))) break;
    }
    return P;
  };
  M.careResidual = (A, B, Q, R, P) => M.normFro(M.add(M.add(M.mul(M.T(A), P), M.mul(P, A)), M.sub(Q, M.mul(M.mul(P, M.mul(M.mul(B, M.inv(R)), M.T(B))), P))));
  /* LQR (continuous time): u = -K x, K = R^{-1} B^T P. */
  M.lqr = (A, B, Q, R) => { const P = M.care(A, B, Q, R); return { P, K: M.mul(M.inv(R), M.mul(M.T(B), P)) }; };

  /* Discrete algebraic Riccati equation P = Q + A^T P A - A^T P B (R + B^T P B)^{-1} B^T P A, by fixed-point iteration. */
  M.dare = (A, B, Q, R, opt) => {
    opt = opt || {};
    let P = M.clone(Q); const At = M.T(A), Bt = M.T(B);
    for (let it = 0; it < (opt.maxIter || 20000); it++) {
      const PB = M.mul(P, B), S = M.add(R, M.mul(Bt, PB));
      const K = M.solve(S, M.mul(Bt, M.mul(P, A)));
      const Pn = M.sym(M.add(Q, M.sub(M.mul(At, M.mul(P, A)), M.mul(M.mul(At, PB), K))));
      const d = M.normFro(M.sub(Pn, P)); P = Pn;
      if (d < 1e-13 * (1 + M.normFro(P))) break;
    }
    return P;
  };
  M.dlqr = (A, B, Q, R) => { const P = M.dare(A, B, Q, R); const K = M.solve(M.add(R, M.mul(M.T(B), M.mul(P, B))), M.mul(M.T(B), M.mul(P, A))); return { P, K }; };

  /* Smallest singular value of (z I - A) for complex z = zr + i zi. Closed form for n = 2, inverse iteration otherwise. */
  M.sigminShift = (A, zr, zi, iters) => {
    const n = A.length;
    if (n === 2) {
      const a = [zr - A[0][0], zi], b = [-A[0][1], 0], c = [-A[1][0], 0], d = [zr - A[1][1], zi];
      const fro2 = a[0] * a[0] + a[1] * a[1] + b[0] * b[0] + c[0] * c[0] + d[0] * d[0] + d[1] * d[1];
      const detr = a[0] * d[0] - a[1] * d[1] - b[0] * c[0], deti = a[0] * d[1] + a[1] * d[0];
      const det2 = detr * detr + deti * deti;
      const disc = Math.max(0, fro2 * fro2 - 4 * det2);
      // sigma_max^2 from the '+' root (no cancellation), then sigma_min = |det| / sigma_max
      const smax2 = (fro2 + Math.sqrt(disc)) / 2;
      return smax2 > 0 ? Math.sqrt(det2) / Math.sqrt(smax2) : 0;
    }
    const Mr = [], Mi = [];
    for (let i = 0; i < n; i++) { Mr.push(new Float64Array(n)); Mi.push(new Float64Array(n)); for (let j = 0; j < n; j++) Mr[i][j] = -A[i][j]; Mr[i][i] += zr; Mi[i][i] = zi; }
    const piv = []; for (let i = 0; i < n; i++) piv.push(i);
    for (let k = 0; k < n; k++) {
      let p = k, mx = Math.hypot(Mr[k][k], Mi[k][k]);
      for (let i = k + 1; i < n; i++) { const v = Math.hypot(Mr[i][k], Mi[i][k]); if (v > mx) { mx = v; p = i; } }
      if (mx === 0) return 0;
      if (p !== k) { let t = Mr[p]; Mr[p] = Mr[k]; Mr[k] = t; t = Mi[p]; Mi[p] = Mi[k]; Mi[k] = t; const s = piv[p]; piv[p] = piv[k]; piv[k] = s; }
      const dr = Mr[k][k], di = Mi[k][k], dd = dr * dr + di * di;
      for (let i = k + 1; i < n; i++) {
        const er = Mr[i][k], ei = Mi[i][k];
        const fr = (er * dr + ei * di) / dd, fi = (ei * dr - er * di) / dd;
        Mr[i][k] = fr; Mi[i][k] = fi;
        for (let j = k + 1; j < n; j++) { Mr[i][j] -= fr * Mr[k][j] - fi * Mi[k][j]; Mi[i][j] -= fr * Mi[k][j] + fi * Mr[k][j]; }
      }
    }
    const solve = (br, bi) => { // M x = b
      const xr = new Float64Array(n), xi = new Float64Array(n);
      for (let i = 0; i < n; i++) { let sr = br[piv[i]], si = bi[piv[i]]; for (let j = 0; j < i; j++) { sr -= Mr[i][j] * xr[j] - Mi[i][j] * xi[j]; si -= Mr[i][j] * xi[j] + Mi[i][j] * xr[j]; } xr[i] = sr; xi[i] = si; }
      for (let i = n - 1; i >= 0; i--) { let sr = xr[i], si = xi[i]; for (let j = i + 1; j < n; j++) { sr -= Mr[i][j] * xr[j] - Mi[i][j] * xi[j]; si -= Mr[i][j] * xi[j] + Mi[i][j] * xr[j]; } const dr = Mr[i][i], di = Mi[i][i], dd = dr * dr + di * di; xr[i] = (sr * dr + si * di) / dd; xi[i] = (si * dr - sr * di) / dd; }
      return [xr, xi];
    };
    const solveH = (br, bi) => { // M^* x = b, M = P^T L U  =>  U^* L^* P x = b
      const zr = new Float64Array(n), zi = new Float64Array(n);
      for (let i = 0; i < n; i++) { let sr = br[i], si = bi[i]; for (let j = 0; j < i; j++) { sr -= Mr[j][i] * zr[j] + Mi[j][i] * zi[j]; si -= Mr[j][i] * zi[j] - Mi[j][i] * zr[j]; } const dr = Mr[i][i], di = -Mi[i][i], dd = dr * dr + di * di; zr[i] = (sr * dr + si * di) / dd; zi[i] = (si * dr - sr * di) / dd; }
      for (let i = n - 1; i >= 0; i--) { let sr = zr[i], si = zi[i]; for (let j = i + 1; j < n; j++) { sr -= Mr[j][i] * zr[j] + Mi[j][i] * zi[j]; si -= Mr[j][i] * zi[j] - Mi[j][i] * zr[j]; } zr[i] = sr; zi[i] = si; }
      const xr = new Float64Array(n), xi = new Float64Array(n);
      for (let i = 0; i < n; i++) { xr[piv[i]] = zr[i]; xi[piv[i]] = zi[i]; }
      return [xr, xi];
    };
    let vr = new Float64Array(n), vi = new Float64Array(n);
    for (let i = 0; i < n; i++) { vr[i] = 1 + 0.37 * Math.sin(1.7 * i + 0.3); vi[i] = 0.21 * Math.cos(2.3 * i); }
    let lam = 0;
    const maxIt = iters || 40;
    for (let it = 0; it < maxIt; it++) {
      let nv = 0; for (let i = 0; i < n; i++) nv += vr[i] * vr[i] + vi[i] * vi[i]; nv = Math.sqrt(nv);
      for (let i = 0; i < n; i++) { vr[i] /= nv; vi[i] /= nv; }
      const w = solve(vr, vi), u = solveH(w[0], w[1]);
      let nu = 0; for (let i = 0; i < n; i++) nu += u[0][i] * u[0][i] + u[1][i] * u[1][i];
      const prev = lam; lam = Math.sqrt(nu); vr = u[0]; vi = u[1];
      if (!iters && it > 2 && Math.abs(lam - prev) <= 1e-9 * lam) break;
    }
    return 1 / Math.sqrt(lam);
  };

  /* Random numbers: seeded uniform and Gaussian generators. */
  M.rng = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  M.randn = seed => { const u = M.rng(seed); let spare = null; return () => { if (spare !== null) { const s = spare; spare = null; return s; } let a = 0, b = 0; while (a === 0) a = u(); b = u(); const r = Math.sqrt(-2 * Math.log(a)); spare = r * Math.sin(2 * Math.PI * b); return r * Math.cos(2 * Math.PI * b); }; };
  M.randMat = (m, n, seed, s) => { const g = M.randn(seed); const sc = s == null ? 1 : s; return Array.from({ length: m }, () => Array.from({ length: n }, () => sc * g())); };

  /* Complex scalar helpers. */
  const Cx = {
    of: (re, im) => ({ re, im: im || 0 }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    div: (a, b) => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; },
    abs: a => Math.hypot(a.re, a.im),
    arg: a => Math.atan2(a.im, a.re),
    conj: a => ({ re: a.re, im: -a.im }),
    exp: a => { const e = Math.exp(a.re); return { re: e * Math.cos(a.im), im: e * Math.sin(a.im) }; },
    sqrt: a => { const s = csqrt(a.re, a.im); return { re: s[0], im: s[1] }; },
    scale: (a, s) => ({ re: a.re * s, im: a.im * s })
  };

  /* ------------------------------------------------------------------ *
   * 3. Systems helpers
   * ------------------------------------------------------------------ */
  const Sys = {};
  /* Frequency response of a SISO system (A n x n, B n x 1 matrix or vector, C 1 x n matrix or vector, D scalar) at s = i w. */
  Sys.freq = (A, B, C, D, w) => {
    const n = A.length, b = Array.isArray(B[0]) ? B.map(r => r[0]) : B, c = Array.isArray(C[0]) ? C[0] : C;
    const K = M.zeros(2 * n, 2 * n), rhs = new Array(2 * n).fill(0);
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { K[i][j] = -A[i][j]; K[n + i][n + j] = -A[i][j]; } K[i][n + i] = -w; K[n + i][i] = w; rhs[i] = b[i]; }
    const x = M.solve(K, rhs);
    let re = D || 0, im = 0; for (let i = 0; i < n; i++) { re += c[i] * x[i]; im += c[i] * x[n + i]; }
    return { re, im };
  };
  /* Bode data over frequencies ws: magnitude |G|, magnitude in dB, phase in degrees (unwrapped). */
  Sys.bode = (A, B, C, D, ws) => {
    const mag = [], db = [], ph = []; let prev = null;
    for (const w of ws) {
      const g = Sys.freq(A, B, C, D, w); const m = Math.hypot(g.re, g.im); let p = Math.atan2(g.im, g.re) * 180 / Math.PI;
      if (prev !== null) { while (p - prev > 180) p -= 360; while (p - prev < -180) p += 360; }
      prev = p; mag.push(m); db.push(20 * Math.log10(Math.max(m, 1e-300))); ph.push(p);
    }
    return { mag, db, phase: ph };
  };
  Sys.logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, a + (b - a) * i / (n - 1)));
  Sys.linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  /* Zero-order-hold discretization: x_{k+1} = Ad x_k + Bd u_k with sampling period h. */
  Sys.c2d = (A, B, h) => {
    const n = A.length, m = B[0].length, Mx = M.zeros(n + m, n + m);
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) Mx[i][j] = A[i][j] * h; for (let j = 0; j < m; j++) Mx[i][n + j] = B[i][j] * h; }
    const E = M.expm(Mx);
    return { Ad: M.block(E, 0, 0, n, n), Bd: M.block(E, 0, n, n, m) };
  };
  Sys.ctrb = (A, B) => { const n = A.length; let blk = B, cols = []; for (let k = 0; k < n; k++) { for (let j = 0; j < blk[0].length; j++) cols.push(M.col(blk, j)); blk = M.mul(A, blk); } return M.fromCols(cols); };
  Sys.obsv = (A, C) => M.T(Sys.ctrb(M.T(A), M.T(C)));
  /* Infinite-horizon Gramians (A Hurwitz). */
  Sys.gramC = (A, B) => M.lyap(A, M.mul(B, M.T(B)));
  Sys.gramO = (A, C) => M.lyap(M.T(A), M.mul(M.T(C), C));
  /* Finite-horizon controllability Gramian W(t) = int_0^t e^{A s} B B^T e^{A^T s} ds (Van Loan's block exponential). */
  Sys.gramCt = (A, B, t) => {
    const n = A.length, Q = M.mul(B, M.T(B));
    const Mx = M.blocks([[M.scale(A, -t), M.scale(Q, t)], [M.zeros(n, n), M.scale(M.T(A), t)]]);
    const E = M.expm(Mx), F12 = M.block(E, 0, n, n, n), F22 = M.block(E, n, n, n, n);
    return M.sym(M.mul(M.T(F22), F12));
  };
  /* Monic real polynomial coefficients [1, a1, ..., an] from roots given as {re, im} (conjugate pairs) or reals. */
  Sys.poly = roots => {
    let cr = [1], ci = [0];
    roots.forEach(r0 => {
      const r = typeof r0 === 'number' ? { re: r0, im: 0 } : r0;
      const nr = new Array(cr.length + 1).fill(0), ni = new Array(cr.length + 1).fill(0);
      for (let k = 0; k < cr.length; k++) { nr[k] += cr[k]; ni[k] += ci[k]; nr[k + 1] -= cr[k] * r.re - ci[k] * r.im; ni[k + 1] -= cr[k] * r.im + ci[k] * r.re; }
      cr = nr; ci = ni;
    });
    return cr;
  };
  /* Evaluate real polynomial coefficients (highest power first) at complex s. */
  Sys.polyval = (p, s) => { let re = 0, im = 0; for (const a of p) { const t = re * s.re - im * s.im + a; im = re * s.im + im * s.re; re = t; } return { re, im }; };
  Sys.roots = p => { const n = p.length - 1; if (n < 1) return []; const a0 = p[0]; const Cm = M.zeros(n, n); for (let j = 0; j < n; j++) Cm[0][j] = -p[j + 1] / a0; for (let i = 1; i < n; i++) Cm[i][i - 1] = 1; return M.eigvals(Cm); };
  /* Single-input pole placement by Ackermann's formula: K with eig(A - B K) = poles. B is n x 1. */
  Sys.place = (A, B, poles) => {
    const n = A.length, p = Sys.poly(poles);
    let PA = M.zeros(n, n), Ak = M.eye(n);
    for (let k = n; k >= 0; k--) { PA = M.add(PA, M.scale(Ak, p[k])); Ak = M.mul(Ak, A); }
    const Cm = Sys.ctrb(A, B), en = new Array(n).fill(0); en[n - 1] = 1;
    const row = M.solve(M.T(Cm), en); // row^T = e_n^T C^{-1}
    return [M.mv(M.T(PA), row)]; // K = e_n^T C^{-1} p(A), as 1 x n
  };
  /* Transfer function from zeros, poles and gain: returns s -> G(s) (complex). */
  Sys.zpk = (zeros, poles, k) => s => {
    let num = { re: k, im: 0 }, den = { re: 1, im: 0 };
    zeros.forEach(z => { num = Cx.mul(num, Cx.sub(s, typeof z === 'number' ? { re: z, im: 0 } : z)); });
    poles.forEach(p => { den = Cx.mul(den, Cx.sub(s, typeof p === 'number' ? { re: p, im: 0 } : p)); });
    return Cx.div(num, den);
  };
  /* Controllable canonical realization of G(s) = num(s)/den(s) (strictly proper or proper). */
  Sys.tf2ss = (num, den) => {
    const a0 = den[0], d = den.map(v => v / a0); let nm = num.map(v => v / a0);
    const n = d.length - 1; while (nm.length < n + 1) nm = [0].concat(nm);
    const D = nm[0], b = nm.map((v, i) => v - D * d[i]);
    const A = M.zeros(n, n); for (let j = 0; j < n; j++) A[0][j] = -d[j + 1]; for (let i = 1; i < n; i++) A[i][i - 1] = 1;
    const B = M.zeros(n, 1); B[0][0] = 1;
    const C = [b.slice(1)];
    return { A, B, C, D };
  };
  /* Simulate x' = A x + B u(t) with zero-order hold on step h; returns {t, x, y}. u: t -> array (m). */
  Sys.sim = (A, B, C, D, u, x0, tEnd, h) => {
    const n = A.length, m = B[0].length, steps = Math.max(1, Math.round(tEnd / h)), d = Sys.c2d(A, B, h);
    const ts = [0], xs = [x0.slice()], ys = [];
    const out = (x, uu) => (C ? M.vadd(M.mv(C, x), D ? M.mv(D, uu) : new Array(C.length).fill(0)) : null);
    let x = x0.slice(); let uu = u ? u(0) : new Array(m).fill(0); ys.push(out(x, uu));
    for (let k = 0; k < steps; k++) {
      x = M.vadd(M.mv(d.Ad, x), M.mv(d.Bd, uu));
      const t = (k + 1) * h; uu = u ? u(t) : new Array(m).fill(0);
      ts.push(t); xs.push(x.slice()); ys.push(out(x, uu));
    }
    return { t: ts, x: xs, y: ys };
  };
  /* Classical RK4 trajectory of x' = f(x) from x0, n steps of size dt; stops when |x| exceeds bound. */
  Sys.rk4 = (f, x0, dt, steps, bound) => {
    const pts = [x0.slice()]; let x = x0.slice(); const B = bound || 1e6;
    for (let k = 0; k < steps; k++) {
      const k1 = f(x), k2 = f(x.map((v, i) => v + 0.5 * dt * k1[i])), k3 = f(x.map((v, i) => v + 0.5 * dt * k2[i])), k4 = f(x.map((v, i) => v + dt * k3[i]));
      x = x.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      pts.push(x.slice()); if (!x.every(Number.isFinite) || Math.hypot(...x) > B) break;
    }
    return pts;
  };

  /* ------------------------------------------------------------------ *
   * Formatting
   * ------------------------------------------------------------------ */
  const MINUS = '−';
  const fmt = (x, d) => {
    if (d == null) d = 2;
    if (typeof x !== 'number') return String(x);
    if (Number.isNaN(x)) return 'NaN';
    if (!Number.isFinite(x)) return (x < 0 ? MINUS : '') + '∞';
    let s = Math.abs(x) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : x.toFixed(d);
    return s.replace('-', MINUS);
  };
  const fmtSig = (x, sig) => {
    if (!Number.isFinite(x)) return fmt(x);
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) { const e = Math.floor(Math.log10(a)); const m = x / Math.pow(10, e); return fmt(m, Math.max(0, (sig || 3) - 1)) + '×10' + sup(e); }
    const d = Math.max(0, (sig || 3) - 1 - Math.floor(Math.log10(a)));
    return fmt(x, Math.min(d, 6));
  };
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋' };
  function sup(k) { return String(k).split('').map(ch => SUP[ch] || ch).join(''); }
  function sub(k) { return String(k).split('').map(ch => SUB[ch] || ch).join(''); }
  const fmtC = (z, d) => {
    if (d == null) d = 2;
    const tiny = 0.5 * Math.pow(10, -d);
    if (Math.abs(z.im) < tiny) return fmt(z.re, d);
    if (Math.abs(z.re) < tiny) return (z.im < 0 ? MINUS : '') + fmt(Math.abs(z.im), d) + 'i';
    return fmt(z.re, d) + (z.im < 0 ? ' ' + MINUS + ' ' : ' + ') + fmt(Math.abs(z.im), d) + 'i';
  };

  /* ------------------------------------------------------------------ *
   * 4. Theme tokens
   * ------------------------------------------------------------------ */
  const TOKENS = ['paper', 'surface', 'plot-bg', 'ink', 'ink-2', 'muted', 'rule', 'rule-strong', 'grid-minor', 'grid-major', 'axis', 'accent',
    'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'good', 'warn', 'bad', 'font-body', 'font-ui', 'font-mono'];
  const Theme = (() => {
    let cache = null; const subs = new Set();
    const read = () => { const cs = getComputedStyle(document.documentElement); const o = {}; TOKENS.forEach(k => { o[k] = cs.getPropertyValue('--' + k).trim(); }); o.dark = isDark(); return o; };
    const isDark = () => { const t = document.documentElement.getAttribute('data-theme'); if (t === 'dark') return true; if (t === 'light') return false; return !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches); };
    const get = () => { if (!cache) cache = hasDOM ? read() : {}; return cache; };
    const invalidate = () => { cache = null; subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };
    if (hasDOM) {
      try { root.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', invalidate); } catch (e) { /* old browsers */ }
      try { new MutationObserver(invalidate).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) { /* no observer */ }
    }
    return { get, onChange: f => subs.add(f), invalidate };
  })();
  const color = c => {
    if (!c) return Theme.get().ink || '#111';
    if (c[0] === '#' || c.startsWith('rgb') || c.startsWith('hsl')) return c;
    return Theme.get()[c] || c;
  };
  const hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const alpha = (c, a) => {
    c = color(c);
    if (c[0] === '#') { const [r, g, b] = hexToRgb(c); return `rgba(${r},${g},${b},${a})`; }
    if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `,${a})`);
    return c;
  };
  /* Colour maps: value v in [0, 1] -> [r, g, b]. 'seq' is one hue (blue), light to dark in light mode, dark to light in dark mode.
     'div' runs blue - neutral - red. */
  const SEQ_LIGHT = ['#f4f8fe', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
  const SEQ_DARK = ['#151b26', '#16284a', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'];
  const lerpRamp = (stops, v) => {
    v = Math.max(0, Math.min(1, v)); const x = v * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), t = x - i;
    const a = hexToRgb(stops[i]), b = hexToRgb(stops[i + 1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  const cmap = (name, v) => {
    const dark = Theme.get().dark;
    if (name === 'div') {
      const neg = dark ? ['#3987e5', '#383835'] : ['#2a78d6', '#f0efec'], pos = dark ? ['#383835', '#e66767'] : ['#f0efec', '#e34948'];
      return v < 0.5 ? lerpRamp(neg, v * 2) : lerpRamp(pos, (v - 0.5) * 2);
    }
    return lerpRamp(dark ? SEQ_DARK : SEQ_LIGHT, v);
  };

  /* ------------------------------------------------------------------ *
   * 5. Plot
   * ------------------------------------------------------------------ */
  const niceStep = raw => { const e = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; };
  const tickLabel = (v, step) => { const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return fmt(v, Math.min(d, 6)); };
  const reducedMotion = hasDOM && root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  class Painter {
    constructor(p) { this.p = p; this.ctx = p.ctx; this.th = Theme.get(); }
    c(name) { return color(name); }
    X(x) { return this.p.X(x); }
    Y(y) { return this.p.Y(y); }
    get xlim() { return this.p.xlim; }
    get ylim() { return this.p.ylim; }
    _stroke(st, defColor, defW) {
      const ctx = this.ctx;
      ctx.strokeStyle = st.alpha != null ? alpha(st.color || defColor, st.alpha) : color(st.color || defColor);
      ctx.lineWidth = st.width || defW; ctx.setLineDash(st.dash || []); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    line(x0, y0, x1, y1, st) { st = st || {}; const ctx = this.ctx; this._stroke(st, 'ink', 1.5); ctx.beginPath(); ctx.moveTo(this.X(x0), this.Y(y0)); ctx.lineTo(this.X(x1), this.Y(y1)); ctx.stroke(); }
    hline(y, st) { this.line(this.p.xlim[0], y, this.p.xlim[1], y, st); }
    vline(x, st) { this.line(x, this.p.ylim[0], x, this.p.ylim[1], st); }
    /* Infinite line through point q with direction d (world coordinates). */
    ray(q, d, st) { const L = 4 * (Math.abs(this.p.xlim[1] - this.p.xlim[0]) + Math.abs(this.p.ylim[1] - this.p.ylim[0])); const n = Math.hypot(d[0], d[1]) || 1; this.line(q[0] - L * d[0] / n, q[1] - L * d[1] / n, q[0] + L * d[0] / n, q[1] + L * d[1] / n, st); }
    path(pts, st) {
      st = st || {}; if (!pts || pts.length < 2) return; const ctx = this.ctx; this._stroke(st, 'ink', 2);
      ctx.beginPath(); let pen = false;
      for (const q of pts) {
        if (!q || !Number.isFinite(q[0]) || !Number.isFinite(q[1])) { pen = false; continue; }
        const X = this.X(q[0]), Y = this.Y(q[1]);
        if (Math.abs(X) > 1e5 || Math.abs(Y) > 1e5) { pen = false; continue; }
        if (!pen) { ctx.moveTo(X, Y); pen = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
    poly(pts, st) {
      st = st || {}; const ctx = this.ctx; ctx.beginPath();
      pts.forEach((q, i) => { const X = this.X(q[0]), Y = this.Y(q[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.closePath();
      if (st.fill) { ctx.fillStyle = alpha(st.fill, st.fillAlpha != null ? st.fillAlpha : 0.12); ctx.fill(); }
      if (st.stroke !== false) { this._stroke({ color: st.color || st.fill || 'ink', width: st.width || 1.5, dash: st.dash, alpha: st.alpha }, 'ink', 1.5); ctx.stroke(); }
    }
    /* Region between two curves (arrays of [x, y]) for shading. */
    band(upper, lower, st) { st = st || {}; const pts = upper.concat(lower.slice().reverse()); this.poly(pts, { fill: st.fill || 'c1', fillAlpha: st.fillAlpha != null ? st.fillAlpha : 0.12, stroke: false }); }
    arrow(p0, p1, st) {
      st = st || {}; const ctx = this.ctx;
      const x0 = this.X(p0[0]), y0 = this.Y(p0[1]), x1 = this.X(p1[0]), y1 = this.Y(p1[1]);
      const L = Math.hypot(x1 - x0, y1 - y0), w = st.width || 2, head = st.head || Math.max(9, 4.2 * w);
      const col = st.alpha != null ? alpha(st.color || 'ink', st.alpha) : color(st.color || 'ink');
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.setLineDash(st.dash || []); ctx.lineCap = 'round';
      if (L < 0.5) { ctx.beginPath(); ctx.arc(x1, y1, w + 1, 0, 2 * Math.PI); ctx.fill(); }
      else {
        const ux = (x1 - x0) / L, uy = (y1 - y0) / L, hl = Math.min(head, L * 0.7);
        const bx = x1 - ux * hl, by = y1 - uy * hl;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(bx + ux, by + uy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(bx - uy * hl * 0.42, by + ux * hl * 0.42); ctx.lineTo(bx + uy * hl * 0.42, by - ux * hl * 0.42); ctx.closePath(); ctx.fill();
        if (st.label) {
          const off = st.labelOffset || 21;
          this.text([x1 + ux * off + (st.ldx || 0), y1 + uy * off + (st.ldy || 0)], st.label, { px: true, align: 'center', color: st.labelColor || 'ink', size: st.labelSize || 14, font: st.labelFont });
        }
      }
    }
    dot(q, st) {
      st = st || {}; const ctx = this.ctx, r = st.r || 4.5, X = st.px ? q[0] : this.X(q[0]), Y = st.px ? q[1] : this.Y(q[1]);
      if (!Number.isFinite(X) || !Number.isFinite(Y)) return;
      if (st.ring !== false) { ctx.beginPath(); ctx.arc(X, Y, r + 2, 0, 2 * Math.PI); ctx.fillStyle = color('plot-bg'); ctx.fill(); }
      ctx.beginPath(); ctx.arc(X, Y, r, 0, 2 * Math.PI);
      if (st.hollow) { ctx.lineWidth = st.width || 2; ctx.setLineDash([]); ctx.strokeStyle = color(st.color || 'ink'); ctx.stroke(); }
      else { ctx.fillStyle = st.alpha != null ? alpha(st.color || 'ink', st.alpha) : color(st.color || 'ink'); ctx.fill(); }
    }
    /* Pole/zero style markers: shape 'x' or 'o'. */
    marker(q, st) {
      st = st || {}; const ctx = this.ctx, s = st.size || 6, X = this.X(q[0]), Y = this.Y(q[1]);
      ctx.lineWidth = st.width || 2; ctx.setLineDash([]); ctx.strokeStyle = color(st.color || 'ink');
      if (st.shape === 'o') { ctx.beginPath(); ctx.arc(X, Y, s, 0, 2 * Math.PI); if (st.fill !== false) { ctx.fillStyle = color('plot-bg'); ctx.fill(); } ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(X - s, Y - s); ctx.lineTo(X + s, Y + s); ctx.moveTo(X + s, Y - s); ctx.lineTo(X - s, Y + s); ctx.stroke(); }
    }
    text(q, s, st) {
      st = st || {}; const ctx = this.ctx, size = st.size || 13;
      const fam = st.font === 'ui' ? (this.th['font-ui'] || 'sans-serif') : st.font === 'mono' ? (this.th['font-mono'] || 'monospace') : (this.th['font-body'] || 'serif');
      const italic = st.italic != null ? st.italic : (st.font == null || st.font === 'math');
      ctx.font = `${italic ? 'italic ' : ''}${st.weight || 400} ${size}px ${fam}`;
      ctx.textAlign = st.align || 'left'; ctx.textBaseline = st.baseline || 'middle';
      const X = (st.px ? q[0] : this.X(q[0])) + (st.dx || 0), Y = (st.px ? q[1] : this.Y(q[1])) + (st.dy || 0);
      if (st.halo !== false) { ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.strokeStyle = color('plot-bg'); ctx.strokeText(s, X, Y); }
      ctx.fillStyle = color(st.color || 'ink'); ctx.fillText(s, X, Y);
    }
    curve(f, t0, t1, st, n) { const pts = []; const N = n || 240; for (let k = 0; k <= N; k++) pts.push(f(t0 + (t1 - t0) * k / N)); this.path(pts, st); }
    circle(c, r, st) { this.curve(t => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)], 0, 2 * Math.PI, st, 160); }
    /* Image of the unit circle under the 2 x 2 matrix M, centred at c. */
    ellipse(c, Mx, st) {
      const pts = []; for (let k = 0; k <= 160; k++) { const t = 2 * Math.PI * k / 160, x = Math.cos(t), y = Math.sin(t); pts.push([c[0] + Mx[0][0] * x + Mx[0][1] * y, c[1] + Mx[1][0] * x + Mx[1][1] * y]); }
      if (st && st.fill) this.poly(pts, st); else this.path(pts, st);
    }
    /* Graph y = f(x) across the x-limits (log-aware). */
    fn(f, st, opt) {
      opt = opt || {}; const p = this.p, N = opt.n || 400, pts = [];
      const a = opt.x0 != null ? opt.x0 : p.xlim[0], b = opt.x1 != null ? opt.x1 : p.xlim[1];
      for (let k = 0; k <= N; k++) { const x = p.o.logx ? Math.pow(10, Math.log10(a) + (Math.log10(b) - Math.log10(a)) * k / N) : a + (b - a) * k / N; pts.push([x, f(x)]); }
      this.path(pts, st);
    }
    rightAngle(q, d1, d2, st) {
      st = st || {}; const s = (st.size || 10); const ctx = this.ctx;
      const n1 = Math.hypot(d1[0], d1[1]) || 1, n2 = Math.hypot(d2[0], d2[1]) || 1;
      const X = this.X(q[0]), Y = this.Y(q[1]);
      const ax = d1[0] / n1, ay = -d1[1] / n1, bx = d2[0] / n2, by = -d2[1] / n2;
      ctx.beginPath(); ctx.moveTo(X + ax * s, Y + ay * s); ctx.lineTo(X + ax * s + bx * s, Y + ay * s + by * s); ctx.lineTo(X + bx * s, Y + by * s);
      this._stroke({ color: st.color || 'muted', width: st.width || 1.25 }, 'muted', 1.25); ctx.stroke();
    }
    /* Heat map of f(x, y) over the plot area. f returns a value; st.range = [lo, hi] maps it to [0, 1]; st.cmap 'seq' or 'div'. */
    heat(f, st) {
      st = st || {}; const p = this.p, pad = p.o.pad, res = st.res || 3;
      const pw = p.W - pad.l - pad.r, ph = p.H - pad.t - pad.b, nx = Math.max(2, Math.ceil(pw / res)), ny = Math.max(2, Math.ceil(ph / res));
      const lo = st.range ? st.range[0] : 0, hi = st.range ? st.range[1] : 1, a = st.alpha != null ? st.alpha : 1;
      const off = document.createElement('canvas'); off.width = nx; off.height = ny;
      const octx = off.getContext('2d'), img = octx.createImageData(nx, ny);
      for (let j = 0; j < ny; j++) {
        const y = p.invY(pad.t + (j + 0.5) * ph / ny);
        for (let i = 0; i < nx; i++) {
          const x = p.invX(pad.l + (i + 0.5) * pw / nx); const v = f(x, y);
          const t = Number.isFinite(v) ? (v - lo) / (hi - lo) : (v > 0 ? 1 : 0);
          const rgb = typeof st.cmap === 'function' ? st.cmap(t) : cmap(st.cmap || 'seq', t);
          const o = 4 * (j * nx + i); img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = Math.round(255 * a);
        }
      }
      octx.putImageData(img, 0, 0);
      const ctx = this.ctx; ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, pad.l, pad.t, pw, ph); ctx.restore();
    }
    /* Draw a precomputed grid of values F (Float32Array or array, row-major, top row first, nx by ny cells)
       covering the plot area. Compute F once with plot.gridXY(nx, ny) and redraw cheaply. */
    heatGrid(F, nx, ny, st) {
      st = st || {}; const p = this.p, pad = p.o.pad, pw = p.W - pad.l - pad.r, ph = p.H - pad.t - pad.b;
      const lo = st.range ? st.range[0] : 0, hi = st.range ? st.range[1] : 1, a = st.alpha != null ? st.alpha : 1;
      const off = document.createElement('canvas'); off.width = nx; off.height = ny;
      const octx = off.getContext('2d'), img = octx.createImageData(nx, ny);
      for (let k = 0; k < nx * ny; k++) {
        const v = F[k], t = Number.isFinite(v) ? (v - lo) / (hi - lo) : (v > 0 ? 1 : 0);
        const rgb = typeof st.cmap === 'function' ? st.cmap(t) : cmap(st.cmap || 'seq', t);
        img.data[4 * k] = rgb[0]; img.data[4 * k + 1] = rgb[1]; img.data[4 * k + 2] = rgb[2]; img.data[4 * k + 3] = Math.round(255 * a);
      }
      octx.putImageData(img, 0, 0);
      const ctx = this.ctx; ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, pad.l, pad.t, pw, ph); ctx.restore();
    }
    /* Contours of a precomputed grid (same layout as heatGrid; values at cell centres). */
    contourGrid(F, nx, ny, levels, st) {
      st = st || {}; const p = this.p, pad = p.o.pad, pw = p.W - pad.l - pad.r, ph = p.H - pad.t - pad.b, ctx = this.ctx;
      const X = i => pad.l + (i + 0.5) * pw / nx, Y = j => pad.t + (j + 0.5) * ph / ny, at = (i, j) => F[j * nx + i];
      (Array.isArray(levels) ? levels : [levels]).forEach((lev, li) => {
        const s = Array.isArray(st.color) ? st.color[li % st.color.length] : st.color;
        this._stroke({ color: s || 'ink-2', width: st.width || 1.25, dash: st.dash, alpha: st.alpha }, 'ink-2', 1.25);
        ctx.beginPath();
        for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
          const v0 = at(i, j) - lev, v1 = at(i + 1, j) - lev, v2 = at(i + 1, j + 1) - lev, v3 = at(i, j + 1) - lev;
          if (![v0, v1, v2, v3].every(Number.isFinite)) continue;
          const code = (v0 > 0 ? 1 : 0) | (v1 > 0 ? 2 : 0) | (v2 > 0 ? 4 : 0) | (v3 > 0 ? 8 : 0);
          if (code === 0 || code === 15) continue;
          const X0 = X(i), X1 = X(i + 1), Y0 = Y(j), Y1 = Y(j + 1);
          const e = [[X0 + (X1 - X0) * v0 / (v0 - v1), Y0], [X1, Y0 + (Y1 - Y0) * v1 / (v1 - v2)], [X0 + (X1 - X0) * v3 / (v3 - v2), Y1], [X0, Y0 + (Y1 - Y0) * v0 / (v0 - v3)]];
          const seg = (a, b) => { ctx.moveTo(e[a][0], e[a][1]); ctx.lineTo(e[b][0], e[b][1]); };
          switch (code) {
            case 1: case 14: seg(0, 3); break; case 2: case 13: seg(0, 1); break; case 3: case 12: seg(1, 3); break;
            case 4: case 11: seg(1, 2); break; case 5: seg(0, 1); seg(2, 3); break; case 10: seg(0, 3); seg(1, 2); break;
            case 6: case 9: seg(0, 2); break; case 7: case 8: seg(2, 3); break;
          }
        }
        ctx.stroke();
      });
    }
    /* Contours of f at the given levels (marching squares). */
    contour(f, levels, st) {
      st = st || {}; const p = this.p, pad = p.o.pad, N = st.n || 90;
      const pw = p.W - pad.l - pad.r, ph = p.H - pad.t - pad.b, nx = N, ny = Math.max(10, Math.round(N * ph / pw));
      const xs = [], ys = [], F = [];
      for (let i = 0; i <= nx; i++) xs.push(p.invX(pad.l + i * pw / nx));
      for (let j = 0; j <= ny; j++) ys.push(p.invY(pad.t + j * ph / ny));
      for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(f(xs[i], ys[j])); F.push(row); }
      const ctx = this.ctx;
      (Array.isArray(levels) ? levels : [levels]).forEach((lev, li) => {
        const s = Array.isArray(st.color) ? st.color[li % st.color.length] : st.color;
        this._stroke({ color: s || 'ink-2', width: st.width || 1.25, dash: st.dash, alpha: st.alpha }, 'ink-2', 1.25);
        ctx.beginPath();
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const v0 = F[j][i] - lev, v1 = F[j][i + 1] - lev, v2 = F[j + 1][i + 1] - lev, v3 = F[j + 1][i] - lev;
          const code = (v0 > 0 ? 1 : 0) | (v1 > 0 ? 2 : 0) | (v2 > 0 ? 4 : 0) | (v3 > 0 ? 8 : 0);
          if (code === 0 || code === 15) continue;
          if (![v0, v1, v2, v3].every(Number.isFinite)) continue;
          const X0 = pad.l + i * pw / nx, X1 = pad.l + (i + 1) * pw / nx, Y0 = pad.t + j * ph / ny, Y1 = pad.t + (j + 1) * ph / ny;
          const e = [
            [X0 + (X1 - X0) * v0 / (v0 - v1), Y0],
            [X1, Y0 + (Y1 - Y0) * v1 / (v1 - v2)],
            [X0 + (X1 - X0) * v3 / (v3 - v2), Y1],
            [X0, Y0 + (Y1 - Y0) * v0 / (v0 - v3)]
          ];
          const seg = (a, b) => { ctx.moveTo(e[a][0], e[a][1]); ctx.lineTo(e[b][0], e[b][1]); };
          switch (code) {
            case 1: case 14: seg(0, 3); break;
            case 2: case 13: seg(0, 1); break;
            case 3: case 12: seg(1, 3); break;
            case 4: case 11: seg(1, 2); break;
            case 5: seg(0, 1); seg(2, 3); break;
            case 10: seg(0, 3); seg(1, 2); break;
            case 6: case 9: seg(0, 2); break;
            case 7: case 8: seg(2, 3); break;
          }
        }
        ctx.stroke();
      });
    }
    /* Direction field of x' = f(x): short arrows of fixed screen length on a grid. */
    field(f, st) {
      st = st || {}; const p = this.p, n = st.n || 17, len = st.len || 11, ctx = this.ctx;
      const col = alpha(st.color || 'muted', st.alpha != null ? st.alpha : 0.55);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([]);
      const pad = p.o.pad, pw = p.W - pad.l - pad.r, ph = p.H - pad.t - pad.b, ny = Math.max(3, Math.round(n * ph / pw));
      for (let i = 0; i <= n; i++) for (let j = 0; j <= ny; j++) {
        const X = pad.l + i * pw / n, Y = pad.t + j * ph / ny, x = p.invX(X), y = p.invY(Y);
        const v = f([x, y]); const vx = this.X(x + v[0]) - X, vy = this.Y(y + v[1]) - Y, L = Math.hypot(vx, vy);
        if (!(L > 1e-12)) { ctx.beginPath(); ctx.arc(X, Y, 1.2, 0, 2 * Math.PI); ctx.fill(); continue; }
        const ux = vx / L, uy = vy / L, x0 = X - ux * len / 2, y0 = Y - uy * len / 2, x1 = X + ux * len / 2, y1 = Y + uy * len / 2;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * 4 - uy * 2.5, y1 - uy * 4 + ux * 2.5); ctx.lineTo(x1 - ux * 4 + uy * 2.5, y1 - uy * 4 - ux * 2.5); ctx.closePath(); ctx.fill();
      }
    }
    /* Trajectory of x' = f(x) from x0 (RK4), drawn as a path; st.T total time, st.dt step, st.both integrates backward too. */
    traj(f, x0, st) {
      st = st || {}; const T = st.T || 8, dt = st.dt || 0.02, steps = Math.round(T / dt);
      const bound = 6 * (Math.abs(this.p.xlim[1] - this.p.xlim[0]) + Math.abs(this.p.ylim[1] - this.p.ylim[0]));
      const fwd = Sys.rk4(f, x0, dt, steps, bound);
      let pts = fwd;
      if (st.both) { const back = Sys.rk4(x => f(x).map(v => -v), x0, dt, steps, bound); pts = back.reverse().concat(fwd.slice(1)); }
      this.path(pts, { color: st.color || 'c1', width: st.width || 1.6, alpha: st.alpha, dash: st.dash });
      if (st.arrowAt != null && fwd.length > 3) {
        const k = Math.min(fwd.length - 2, Math.max(1, Math.round(st.arrowAt * (fwd.length - 1))));
        this.arrow(fwd[k - 1], fwd[k + 1], { color: st.color || 'c1', width: st.width || 1.6, head: 8, alpha: st.alpha });
      }
      return pts;
    }
    grid(kind) {
      const p = this.p, ctx = this.ctx, pad = p.o.pad, x0 = pad.l, x1 = p.W - pad.r, y0 = pad.t, y1 = p.H - pad.b;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.setLineDash([]); ctx.lineWidth = 1;
      const draw = (vals, isX, col) => { ctx.strokeStyle = color(col); ctx.beginPath(); vals.forEach(v => { const q = Math.round(isX ? p.X(v) : p.Y(v)) + 0.5; if (isX) { ctx.moveTo(q, y0); ctx.lineTo(q, y1); } else { ctx.moveTo(x0, q); ctx.lineTo(x1, q); } }); ctx.stroke(); };
      const axisVals = (isLog, lim, px) => {
        if (isLog) {
          const a = Math.floor(Math.log10(lim[0])), b = Math.ceil(Math.log10(lim[1])), major = [], minor = [];
          for (let e = a; e <= b; e++) { major.push(Math.pow(10, e)); for (let k = 2; k <= 9; k++) minor.push(k * Math.pow(10, e)); }
          return { major, minor, step: 1 };
        }
        const span = Math.abs(lim[1] - lim[0]), step = niceStep(span / Math.max(2, px / 86)), minorStep = step / (kind === 'paper' ? 5 : 2);
        const major = [], minor = [];
        for (let v = Math.ceil(Math.min(lim[0], lim[1]) / minorStep) * minorStep; v <= Math.max(lim[0], lim[1]) + 1e-12; v += minorStep) {
          const isMajor = Math.abs(v / step - Math.round(v / step)) < 1e-6; (isMajor ? major : minor).push(Math.abs(v) < 1e-12 ? 0 : v);
        }
        return { major, minor, step };
      };
      const gx = axisVals(p.o.logx, p.xlim, x1 - x0), gy = axisVals(p.o.logy, p.ylim, y1 - y0);
      if (kind !== 'none-hidden') {
        if (kind !== 'lines') { draw(gx.minor, true, 'grid-minor'); draw(gy.minor, false, 'grid-minor'); }
        draw(gx.major, true, 'grid-major'); draw(gy.major, false, 'grid-major');
      }
      ctx.restore();
      this._gx = gx; this._gy = gy;
    }
    axes() {
      const p = this.p, ctx = this.ctx, pad = p.o.pad, x0 = pad.l, x1 = p.W - pad.r, y0 = pad.t, y1 = p.H - pad.b;
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = color('axis'); ctx.lineWidth = 1.25; ctx.beginPath();
      const ox = Math.round(p.X(0)) + 0.5, oy = Math.round(p.Y(0)) + 0.5;
      if (oy >= y0 && oy <= y1) { ctx.moveTo(x0, oy); ctx.lineTo(x1, oy); }
      if (ox >= x0 && ox <= x1) { ctx.moveTo(ox, y0); ctx.lineTo(ox, y1); }
      ctx.stroke();
      if (p.o.ticks !== false && this._gx) {
        ctx.font = `400 10.5px ${this.th['font-ui'] || 'sans-serif'}`; ctx.fillStyle = color('muted');
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const ty = Math.min(Math.max(oy + 4, y0), y1 - 14);
        this._gx.major.forEach(v => { if (Math.abs(v) < 1e-12) return; const X = p.X(v); if (X < x0 + 8 || X > x1 - 8) return; ctx.fillText(tickLabel(v, this._gx.step), X, ty); });
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        const tx = Math.min(Math.max(ox - 5, x0 + 22), x1 - 2);
        this._gy.major.forEach(v => { if (Math.abs(v) < 1e-12) return; const Y = p.Y(v); if (Y < y0 + 8 || Y > y1 - 8) return; ctx.fillText(tickLabel(v, this._gy.step), tx, Y); });
      }
      if (p.o.xlabel) this.text([x1 - 4, oy >= y0 && oy <= y1 ? oy - 10 : y1 - 10], p.o.xlabel, { px: true, align: 'right', color: 'ink-2', size: 13 });
      if (p.o.ylabel) this.text([ox >= x0 && ox <= x1 ? ox + 8 : x0 + 8, y0 + 10], p.o.ylabel, { px: true, align: 'left', color: 'ink-2', size: 13 });
      ctx.restore();
    }
    frame() {
      const p = this.p, ctx = this.ctx, pad = p.o.pad, x0 = pad.l, x1 = p.W - pad.r, y0 = pad.t, y1 = p.H - pad.b;
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = color('axis'); ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
      if (p.o.zeroLine !== false && !p.o.logy && p.ylim[0] < 0 && p.ylim[1] > 0) { const Y = Math.round(p.Y(0)) + 0.5; ctx.beginPath(); ctx.moveTo(x0, Y); ctx.lineTo(x1, Y); ctx.stroke(); }
      ctx.font = `400 10.5px ${this.th['font-ui'] || 'sans-serif'}`; ctx.fillStyle = color('muted');
      if (this._gx) {
        // On log axes, label every k-th decade when decades are too close together to read.
        const every = (isLog, lim, px, minPx) => { if (!isLog) return 1; const dec = Math.abs(Math.log10(lim[1]) - Math.log10(lim[0])) || 1; return Math.max(1, Math.ceil(minPx / (px / dec))); };
        const kx = every(p.o.logx, p.xlim, x1 - x0, 38), ky = every(p.o.logy, p.ylim, y1 - y0, 20);
        const keep = (v, k) => k === 1 || Math.round(Math.log10(v)) % k === 0;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        this._gx.major.forEach(v => { const X = p.X(v); if (X < x0 - 1 || X > x1 + 1) return; if (p.o.logx && !keep(v, kx)) return; const s = p.o.logx ? logLabel(v) : (p.o.xfmt ? p.o.xfmt(v) : tickLabel(v, this._gx.step)); ctx.fillText(s, X, y1 + 5); });
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        this._gy.major.forEach(v => { const Y = p.Y(v); if (Y < y0 - 1 || Y > y1 + 1) return; if (p.o.logy && !keep(v, ky)) return; const s = p.o.logy ? logLabel(v) : (p.o.yfmt ? p.o.yfmt(v) : tickLabel(v, this._gy.step)); ctx.fillText(s, x0 - 5, Y); });
      }
      ctx.fillStyle = color('ink-2'); ctx.font = `italic 400 13px ${this.th['font-body'] || 'serif'}`;
      if (p.o.xlabel) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(p.o.xlabel, (x0 + x1) / 2, p.H - 2); }
      if (p.o.ylabel) { ctx.save(); ctx.translate(12, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.o.ylabel, 0, 0); ctx.restore(); }
      ctx.restore();
    }
    handles() {
      const p = this.p, ctx = this.ctx;
      p.handles.forEach(h => {
        if (h.hidden) return; const q = h.get(); const X = p.X(q[0]), Y = p.Y(q[1]); if (!Number.isFinite(X) || !Number.isFinite(Y)) return;
        const r = h.r || 7, active = p.dragging === h || p.hover === h;
        if (active) { ctx.beginPath(); ctx.arc(X, Y, r + 6, 0, 2 * Math.PI); ctx.fillStyle = alpha(h.color || 'accent', 0.18); ctx.fill(); }
        ctx.beginPath(); ctx.arc(X, Y, r + 2, 0, 2 * Math.PI); ctx.fillStyle = color('plot-bg'); ctx.fill();
        ctx.beginPath(); ctx.arc(X, Y, r, 0, 2 * Math.PI); ctx.fillStyle = color(h.color || 'accent'); ctx.fill();
        ctx.beginPath(); ctx.arc(X, Y, r * 0.36, 0, 2 * Math.PI); ctx.fillStyle = color('plot-bg'); ctx.fill();
        if (h.label) this.text([X + r + 6, Y - r - 4], h.label, { px: true, color: 'ink', size: 14 });
      });
    }
  }
  const logLabel = v => { const e = Math.round(Math.log10(v)); if (Math.abs(Math.log10(v) - e) > 1e-6) return ''; if (e === 0) return '1'; if (e === 1) return '10'; return '10' + sup(e); };

  class Plot {
    constructor(el, o) {
      this.el = typeof el === 'string' ? document.querySelector(el) : el;
      if (!this.el) throw new Error('LT.Plot: container not found: ' + el);
      this.o = Object.assign({ xlim: [-1, 1], ylim: [-1, 1], equal: false, aspect: 0.62, height: null, minH: 180, maxH: 560, pad: null, grid: 'paper', axes: true, frame: false, xlabel: '', ylabel: '', logx: false, logy: false, ticks: true, label: '' }, o || {});
      if (!this.o.pad) this.o.pad = this.o.frame ? { l: 50, r: 14, t: 12, b: this.o.xlabel ? 40 : 26 } : { l: 6, r: 6, t: 6, b: 6 };
      if (this.o.frame && this.o.ylabel && this.o.pad.l < 62) this.o.pad.l = 62;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'lt-canvas';
      this.canvas.setAttribute('role', 'img'); this.canvas.setAttribute('aria-label', this.o.label || 'interactive plot');
      this.el.appendChild(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.handles = []; this.draw = null; this.dragging = null; this.hover = null; this._raf = 0; this.W = 0; this.H = 0;
      this.xlim = this.o.xlim.slice(); this.ylim = this.o.ylim.slice();
      this._bind(); Plot.all.add(this);
      if ('ResizeObserver' in root) { this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(this.el); }
      this.resize();
    }
    _tx(x) { return this.o.logx ? Math.log10(Math.max(x, 1e-300)) : x; }
    _ty(y) { return this.o.logy ? Math.log10(Math.max(y, 1e-300)) : y; }
    X(x) { const a = this._tx(this.xlim[0]), b = this._tx(this.xlim[1]); return this.o.pad.l + (this._tx(x) - a) / (b - a) * (this.W - this.o.pad.l - this.o.pad.r); }
    Y(y) { const a = this._ty(this.ylim[0]), b = this._ty(this.ylim[1]); return this.H - this.o.pad.b - (this._ty(y) - a) / (b - a) * (this.H - this.o.pad.t - this.o.pad.b); }
    invX(px) { const a = this._tx(this.xlim[0]), b = this._tx(this.xlim[1]); const v = a + (px - this.o.pad.l) / (this.W - this.o.pad.l - this.o.pad.r) * (b - a); return this.o.logx ? Math.pow(10, v) : v; }
    invY(py) { const a = this._ty(this.ylim[0]), b = this._ty(this.ylim[1]); const v = a + (this.H - this.o.pad.b - py) / (this.H - this.o.pad.t - this.o.pad.b) * (b - a); return this.o.logy ? Math.pow(10, v) : v; }
    resize() {
      const w = Math.max(140, Math.floor(this.el.clientWidth || 0));
      let h;
      if (this.o.height) h = this.o.height;
      else if (this.o.equal) { const xr = this.o.xlim[1] - this.o.xlim[0], yr = this.o.ylim[1] - this.o.ylim[0], pw = w - this.o.pad.l - this.o.pad.r; h = pw * yr / xr + this.o.pad.t + this.o.pad.b; }
      else h = w * this.o.aspect;
      h = Math.round(Math.max(this.o.minH, Math.min(this.o.maxH, h)));
      if (w === this.W && h === this.H) return;
      this.W = w; this.H = h; this.dpr = Math.min(root.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
      this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
      this._fit(); this.render();
    }
    _fit() {
      this.xlim = this.o.xlim.slice(); this.ylim = this.o.ylim.slice();
      if (this.o.equal && this.W) {
        const pw = this.W - this.o.pad.l - this.o.pad.r, ph = this.H - this.o.pad.t - this.o.pad.b;
        const xr = this.xlim[1] - this.xlim[0], yr = this.ylim[1] - this.ylim[0], s = Math.min(pw / xr, ph / yr);
        const cx = (this.xlim[0] + this.xlim[1]) / 2, cy = (this.ylim[0] + this.ylim[1]) / 2;
        this.xlim = [cx - pw / s / 2, cx + pw / s / 2]; this.ylim = [cy - ph / s / 2, cy + ph / s / 2];
      }
    }
    /* Cell-centre world coordinates for an nx by ny grid over the plot area (for heatGrid / contourGrid). */
    gridXY(nx, ny) {
      const pad = this.o.pad, pw = this.W - pad.l - pad.r, ph = this.H - pad.t - pad.b, xs = [], ys = [];
      for (let i = 0; i < nx; i++) xs.push(this.invX(pad.l + (i + 0.5) * pw / nx));
      for (let j = 0; j < ny; j++) ys.push(this.invY(pad.t + (j + 0.5) * ph / ny));
      return { xs, ys };
    }
    setLimits(xlim, ylim) { if (xlim) this.o.xlim = xlim.slice(); if (ylim) this.o.ylim = ylim.slice(); this._fit(); this.redraw(); }
    addHandle(h) { this.handles.push(h); this.redraw(); return h; }
    redraw() { if (this._raf || !hasDOM) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.render(); }); }
    render() {
      if (!this.W) return;
      const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H); ctx.fillStyle = color('plot-bg'); ctx.fillRect(0, 0, this.W, this.H);
      const g = new Painter(this);
      if (this.o.grid && this.o.grid !== 'none') g.grid(this.o.grid); else g.grid('none-hidden');
      if (this.o.frame) g.frame(); else if (this.o.axes) g.axes();
      if (this.draw) {
        ctx.save();
        if (this.o.frame || this.o.clip) { const pad = this.o.pad; ctx.beginPath(); ctx.rect(pad.l, pad.t, this.W - pad.l - pad.r, this.H - pad.t - pad.b); ctx.clip(); }
        try { this.draw(g, this); } catch (e) { console.error(e); }
        ctx.restore();
      }
      if (this.after) { try { this.after(g, this); } catch (e) { console.error(e); } }
      g.handles();
    }
    _bind() {
      const cv = this.canvas;
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const pick = (px, py) => {
        let best = null, bd = 1e9;
        for (const h of this.handles) { if (h.hidden) continue; const q = h.get(); const d = Math.hypot(this.X(q[0]) - px, this.Y(q[1]) - py); if (d < (h.r || 7) + 12 && d < bd) { bd = d; best = h; } }
        return best;
      };
      this._pick = pick;
      cv.addEventListener('pointerdown', e => {
        const [px, py] = pos(e), h = pick(px, py);
        if (h) { this.dragging = h; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } e.preventDefault(); this._move(h, px, py); }
        else if (this.onClick) { this.onClick(this.invX(px), this.invY(py), e); }
      });
      cv.addEventListener('pointermove', e => {
        const [px, py] = pos(e);
        if (this.dragging) { this._move(this.dragging, px, py); e.preventDefault(); return; }
        const h = pick(px, py); if (h !== this.hover) { this.hover = h; this.redraw(); }
        cv.style.cursor = h ? 'grab' : (this.onClick ? 'crosshair' : 'default');
        if (this.onHover) this.onHover(this.invX(px), this.invY(py), e);
      });
      const end = e => { if (this.dragging) { this.dragging = null; try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ } this.redraw(); if (this.onDragEnd) this.onDragEnd(); } };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      cv.addEventListener('pointerleave', () => { if (this.hover) { this.hover = null; this.redraw(); } if (this.onLeave) this.onLeave(); });
      cv.addEventListener('touchstart', e => { if (!e.touches.length) return; const t = e.touches[0], r = cv.getBoundingClientRect(); if (this.captureTouch || pick(t.clientX - r.left, t.clientY - r.top)) e.preventDefault(); }, { passive: false });
      cv.style.touchAction = 'pan-y';
    }
    _move(h, px, py) {
      let x = this.invX(px), y = this.invY(py);
      if (h.snap) { x = Math.round(x / h.snap) * h.snap; y = Math.round(y / h.snap) * h.snap; }
      x = Math.max(Math.min(this.xlim[0], this.xlim[1]), Math.min(Math.max(this.xlim[0], this.xlim[1]), x));
      y = Math.max(Math.min(this.ylim[0], this.ylim[1]), Math.min(Math.max(this.ylim[0], this.ylim[1]), y));
      if (h.constrain) { const c = h.constrain(x, y); x = c[0]; y = c[1]; }
      h.set(x, y); this.redraw();
    }
  }
  Plot.all = new Set();
  Theme.onChange(() => Plot.all.forEach(p => p.redraw()));

  /* Animation loop that runs only while its element is on screen and the tab is visible. */
  function animate(step, opt) {
    opt = opt || {};
    let running = false, last = 0, t = 0, raf = 0, visible = true;
    const frame = ts => {
      raf = 0; if (!running) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      if (visible && !document.hidden) { t += dt; try { step(dt, t); } catch (e) { console.error(e); running = false; return; } }
      raf = requestAnimationFrame(frame);
    };
    if (opt.el && 'IntersectionObserver' in root) {
      const el = typeof opt.el === 'string' ? document.querySelector(opt.el) : opt.el;
      new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }).observe(el);
    }
    const ctl = {
      play() { if (!running) { running = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); } if (opt.onState) opt.onState(true); },
      pause() { running = false; if (opt.onState) opt.onState(false); },
      toggle() { if (running) this.pause(); else this.play(); return running; },
      reset() { t = 0; },
      get running() { return running; },
      get t() { return t; }
    };
    if (opt.autoplay && !reducedMotion) ctl.play();
    return ctl;
  }

  /* ------------------------------------------------------------------ *
   * 6. UI controls
   * ------------------------------------------------------------------ */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const UI = {
    panel(target) {
      const rootEl = typeof target === 'string' ? document.querySelector(target) : target;
      if (!rootEl) throw new Error('LT.ui.panel: container not found: ' + target);
      const api = {
        el: rootEl,
        slider(o) {
          const wrap = el('label', 'ctl ctl-slider'); wrap.appendChild(el('span', 'ctl-label', o.label));
          const input = el('input'); input.type = 'range'; if (o.id) input.id = o.id;
          const toVal = s => (o.log ? Math.pow(10, s) : s), toPos = v => (o.log ? Math.log10(v) : v);
          input.min = o.min; input.max = o.max; input.step = o.step || (o.max - o.min) / 400; input.value = toPos(o.value);
          const out = el('output', 'ctl-value');
          const f = o.fmt || (v => (o.log ? fmtSig(v, 3) : fmt(v, o.digits != null ? o.digits : 2)));
          const show = () => { out.textContent = f(toVal(+input.value)); };
          input.addEventListener('input', () => { show(); if (o.onInput) o.onInput(toVal(+input.value)); });
          wrap.appendChild(input); wrap.appendChild(out); rootEl.appendChild(wrap); show();
          return { el: wrap, input, get: () => toVal(+input.value), set: (v, fire) => { input.value = toPos(v); show(); if (fire && o.onInput) o.onInput(toVal(+input.value)); } };
        },
        select(o) {
          const wrap = el('label', 'ctl ctl-select'); wrap.appendChild(el('span', 'ctl-label', o.label));
          const s = el('select'); if (o.id) s.id = o.id;
          o.options.forEach(opt => { const op = el('option'); const v = Array.isArray(opt) ? opt[0] : opt.value; op.value = v; op.textContent = Array.isArray(opt) ? opt[1] : opt.label; s.appendChild(op); });
          if (o.value != null) s.value = o.value;
          s.addEventListener('change', () => { if (o.onChange) o.onChange(s.value); });
          wrap.appendChild(s); rootEl.appendChild(wrap);
          return { el: wrap, input: s, get: () => s.value, set: (v, fire) => { s.value = v; if (fire && o.onChange) o.onChange(v); } };
        },
        toggle(o) {
          const wrap = el('label', 'ctl ctl-toggle'); const c = el('input'); c.type = 'checkbox'; if (o.id) c.id = o.id; c.checked = !!o.value;
          wrap.appendChild(c); wrap.appendChild(el('span', 'ctl-label', o.label));
          c.addEventListener('change', () => { if (o.onChange) o.onChange(c.checked); });
          rootEl.appendChild(wrap);
          return { el: wrap, input: c, get: () => c.checked, set: (v, fire) => { c.checked = !!v; if (fire && o.onChange) o.onChange(c.checked); } };
        },
        button(o) {
          const b = el('button', 'btn' + (o.kind ? ' btn-' + o.kind : ''), o.label); b.type = 'button'; if (o.id) b.id = o.id;
          b.addEventListener('click', e => { if (o.onClick) o.onClick(e, b); }); rootEl.appendChild(b);
          return { el: b, setLabel: s => { b.innerHTML = s; } };
        },
        buttons(list) { const g = el('div', 'ctl ctl-buttons'); rootEl.appendChild(g); const sub = UI.panel(g); return list.map(o => sub.button(o)); },
        readout(o) {
          const d = el('div', 'readout' + (o && o.wide ? ' readout-wide' : '')); if (o && o.id) d.id = o.id; rootEl.appendChild(d);
          return { el: d, set: html => { d.innerHTML = html; } };
        },
        note(html) { const d = el('div', 'ctl-note', html); rootEl.appendChild(d); return d; }
      };
      return api;
    },
    /* Key-value rows for a readout: [['det A', '1.25'], ...] */
    kv(rows) { return '<dl class="kv">' + rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('') + '</dl>'; },
    legend(items) { return '<div class="legend">' + items.map(it => `<span class="key"><i class="sw ${it.kind || ''}" style="--sw:${color(it.color)}"></i><span>${it.label}</span></span>`).join('') + '</div>'; },
    mat(A, d, o) {
      o = o || {}; const n = A[0].length;
      const cells = A.map(r => r.map(v => `<span>${typeof v === 'string' ? v : (o.complex ? fmtC(v, d) : fmt(v, d == null ? 2 : d))}</span>`).join('')).join('');
      return `<span class="mat">${o.name ? `<span class="mat-name">${o.name}</span><span class="mat-eq">=</span>` : ''}<span class="mat-br"><span class="mat-grid" style="grid-template-columns:repeat(${n}, auto)">${cells}</span></span></span>`;
    },
    vec(v, d, o) { return UI.mat(v.map(x => [x]), d, o); }
  };

  /* ------------------------------------------------------------------ *
   * 7. Page shell
   * ------------------------------------------------------------------ */
  const NUMBERED = { def: 'Definition', thm: 'Theorem', prop: 'Proposition', lem: 'Lemma', cor: 'Corollary', ex: 'Example', cex: 'Counterexample' };
  const STAGES = { prob: 'Problem', setting: 'Setting and assumptions', goal: 'Goal', probe: 'Probe', pattern: 'Pattern', conj: 'Conjecture', rem: 'Remark', deduce: 'Deduction', src: 'Open source', why: 'Why it matters' };
  const Page = {
    labels: {},
    init() {
      if (!hasDOM) return;
      const main = document.querySelector('main');
      const ch = main ? main.getAttribute('data-chapter') : null;
      this.chapter = ch;
      this.buildNav(ch);
      if (ch) { this.numberSections(ch); this.numberBlocks(ch); this.numberVisuals(ch); }
      this.fillXrefs();
      if (ch) this.prevNext(ch);
      this.menu();
    },
    toc() { return root.LT_TOC || { parts: [], extras: [] }; },
    chapters() { const out = []; this.toc().parts.forEach(p => p.chapters.forEach(c => out.push(Object.assign({ part: p }, c)))); return out; },
    buildNav(ch) {
      const nav = document.getElementById('lt-side'); if (!nav) return;
      const toc = this.toc(); const here = (location.pathname.split('/').pop() || 'index.html');
      let html = `<a class="brand" href="index.html">${toc.title || 'Linear Theory'}<span>${toc.subtitle || 'Interactive study guide'}</span></a>`;
      toc.parts.forEach(p => {
        html += `<div class="side-part"><div class="side-part-name">Part ${p.id} · ${p.short || p.name}</div>`;
        p.chapters.forEach(c => {
          const cur = String(c.n) === String(ch);
          html += `<a class="side-ch${cur ? ' current' : ''}" href="${c.file}"${cur ? ' aria-current="page"' : ''}><span class="num">${c.n}</span><span>${c.short || c.title}</span></a>`;
          if (cur) html += '<div class="side-toc" id="lt-side-toc"></div>';
        });
        html += '</div>';
      });
      html += '<div class="side-part"><div class="side-part-name">Reference</div>';
      (toc.extras || []).forEach(x => { html += `<a class="side-ch${here === x.file ? ' current' : ''}" href="${x.file}"><span class="num">·</span><span>${x.title}</span></a>`; });
      html += '</div>';
      nav.innerHTML = html;
    },
    numberSections(ch) {
      const box = document.getElementById('lt-side-toc'); let links = ''; let k = 0;
      document.querySelectorAll('main section.sec').forEach(sec => {
        const h = sec.querySelector('h2'); if (!h) return; k++;
        const num = `${ch}.${k}`; sec.dataset.num = num;
        const s = el('span', 'secnum', num); h.insertBefore(s, h.firstChild);
        if (!sec.id) sec.id = 's' + k;
        const txt = h.textContent.replace(num, '').trim();
        links += `<a href="#${sec.id}"><span class="num">${num}</span>${escapeHTML(txt)}</a>`;
        this.labels[sec.id] = 'Section ' + num;
      });
      document.querySelectorAll('main section.selfcheck, main section.refs').forEach(sec => {
        const h = sec.querySelector('h2'); if (!h || !sec.id) return;
        links += `<a href="#${sec.id}"><span class="num">·</span>${escapeHTML(h.textContent.trim())}</a>`;
      });
      if (box) box.innerHTML = links;
    },
    numberBlocks(ch) {
      let k = 0;
      document.querySelectorAll('main .blk').forEach(b => {
        const type = Array.from(b.classList).find(c => NUMBERED[c] || STAGES[c]);
        if (!type) return;
        let label;
        if (NUMBERED[type]) { k++; label = `${NUMBERED[type]} ${ch}.${k}`; if (b.id) this.labels[b.id] = label; b.dataset.num = `${ch}.${k}`; }
        else label = STAGES[type];
        const first = b.querySelector(':scope > p, :scope > div > p, :scope > ul > li, :scope > ol > li') || b;
        const tag = el('span', 'blk-label', label);
        if (b.dataset.name) { const nm = el('span', 'blk-name', b.dataset.name); tag.appendChild(nm); }
        first.insertBefore(document.createTextNode(' '), first.firstChild);
        first.insertBefore(tag, first.firstChild);
      });
    },
    numberVisuals(ch) {
      let k = 0;
      document.querySelectorAll('main .viz').forEach(v => {
        k++; const lab = v.querySelector('.viz-label'); const txt = `Visual ${ch}.${k}`;
        if (lab) lab.textContent = txt; if (v.id) this.labels[v.id] = txt;
      });
    },
    fillXrefs() {
      document.querySelectorAll('a.xref').forEach(a => {
        const href = a.getAttribute('href') || ''; if (href[0] !== '#') return;
        const id = href.slice(1); if (!a.textContent.trim()) a.textContent = this.labels[id] || ('??' + id);
      });
    },
    prevNext(ch) {
      const list = this.chapters(), i = list.findIndex(c => String(c.n) === String(ch)); const main = document.querySelector('main .content') || document.querySelector('main');
      if (i < 0 || !main) return;
      const prev = list[i - 1], next = list[i + 1];
      const nav = el('nav', 'prevnext'); nav.setAttribute('aria-label', 'Chapter navigation');
      nav.innerHTML = (prev ? `<a class="pn prev" href="${prev.file}"><span class="pn-dir">Previous</span><span class="pn-title">${prev.n} · ${prev.short || prev.title}</span></a>` : `<a class="pn prev" href="index.html"><span class="pn-dir">Back to</span><span class="pn-title">Contents</span></a>`) +
        (next ? `<a class="pn next" href="${next.file}"><span class="pn-dir">Next</span><span class="pn-title">${next.n} · ${next.short || next.title}</span></a>` : `<a class="pn next" href="notation.html"><span class="pn-dir">Reference</span><span class="pn-title">Notation and abbreviations</span></a>`);
      main.appendChild(nav);
    },
    menu() {
      const btn = document.getElementById('lt-menu'), side = document.getElementById('lt-side'); if (!btn || !side) return;
      const set = open => { document.body.classList.toggle('nav-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
      btn.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
      side.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
      document.addEventListener('click', e => { if (document.body.classList.contains('nav-open') && !side.contains(e.target) && e.target !== btn) set(false); });
    }
  };
  function escapeHTML(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* Re-typeset math inside an element created after the initial MathJax pass. */
  const typeset = target => {
    const els = (Array.isArray(target) ? target : [target]).map(t => (typeof t === 'string' ? document.querySelector(t) : t)).filter(Boolean);
    if (root.MathJax && root.MathJax.typesetPromise && root.__LT_MATH_DONE) return root.MathJax.typesetPromise(els).catch(e => console.error(e));
    return Promise.resolve();
  };

  /* Run fn at most once per animation frame (for slider input that triggers heavy work). */
  const throttle = fn => { let pending = false, lastArgs = null; return (...a) => { lastArgs = a; if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; fn(...lastArgs); }); }; };
  /* Run fn once, ms after the last call (for a full-resolution recompute after interaction stops). */
  const debounce = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms == null ? 180 : ms); }; };

  root.LT = {
    version: '1.0', mat: M, cx: Cx, sys: Sys, Plot, Painter, animate, ui: UI, page: Page, theme: Theme, color, alpha, cmap,
    fmt, fmtC, fmtSig, sup, sub, typeset, niceStep, reducedMotion, EPS, throttle, debounce
  };
})(typeof window !== 'undefined' ? window : globalThis);
