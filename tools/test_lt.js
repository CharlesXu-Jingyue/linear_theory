// Numerical tests for assets/lt.js (run: node tools/test_lt.js)
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'lt.js'), 'utf8');
const sandbox = {};
new Function('window', src)(sandbox);
const LT = sandbox.LT, M = LT.mat, S = LT.sys;
let fails = 0, passes = 0;
const ok = (name, cond, info) => { if (cond) passes++; else { fails++; console.log('FAIL', name, info !== undefined ? info : ''); } };
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * (1 + Math.abs(b));
const maxAbs = A => Math.max(...A.flat().map(Math.abs));

// complex matrix helpers for checks
const cmul = (Ar, Ai, Br, Bi) => { const n = Ar.length, m = Br[0].length, k = Br.length; const Cr = M.zeros(n, m), Ci = M.zeros(n, m); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { let sr = 0, si = 0; for (let p = 0; p < k; p++) { sr += Ar[i][p] * Br[p][j] - Ai[i][p] * Bi[p][j]; si += Ar[i][p] * Bi[p][j] + Ai[i][p] * Br[p][j]; } Cr[i][j] = sr; Ci[i][j] = si; } return [Cr, Ci]; };
const toArr = A => A.map(r => Array.from(r));

// 1. LU / solve / det / inv
{
  const A = [[4, 3, 2], [2, 1, 3], [3, 2, 1]];
  ok('det', close(M.det(A), 4 * (1 - 6) - 3 * (2 - 9) + 2 * (4 - 3)));
  const I = M.mul(A, M.inv(A)); ok('inv', maxAbs(M.sub(I, M.eye(3))) < 1e-12);
  const x = M.solve(A, [1, 2, 3]); ok('solve', maxAbs([M.vsub(M.mv(A, x), [1, 2, 3])]) < 1e-12);
}
// 2. QR
{
  const A = M.randMat(5, 3, 7);
  const { Q, R } = M.qr(A);
  ok('qr recon', maxAbs(M.sub(M.mul(Q, R), A)) < 1e-12);
  ok('qr orth', maxAbs(M.sub(M.mul(M.T(Q), Q), M.eye(5))) < 1e-12);
}
// 3. eigSym
{
  const B = M.randMat(6, 6, 3); const A = M.add(B, M.T(B));
  const { values, vectors } = M.eigSym(A);
  const recon = M.mul(M.mul(vectors, M.diag(values)), M.T(vectors));
  ok('eigSym recon', maxAbs(M.sub(recon, A)) < 1e-10, maxAbs(M.sub(recon, A)));
  ok('eigSym sorted', values.every((v, i) => i === 0 || values[i - 1] >= v));
}
// 4. SVD
{
  for (const [m, n, seed] of [[5, 3, 1], [3, 5, 2], [4, 4, 3], [8, 8, 9]]) {
    const A = M.randMat(m, n, seed);
    const { U, S: s, V } = M.svd(A);
    const recon = M.mul(M.mul(U, M.diag(s)), M.T(V));
    ok(`svd recon ${m}x${n}`, maxAbs(M.sub(recon, A)) < 1e-10, maxAbs(M.sub(recon, A)));
    ok(`svd U orth ${m}x${n}`, maxAbs(M.sub(M.mul(M.T(U), U), M.eye(s.length))) < 1e-10);
  }
  // rank deficient
  const A = [[1, 2], [2, 4]];
  const { U, S: s, V } = M.svd(A);
  ok('svd rank1 sv', close(s[0], 5) && Math.abs(s[1]) < 1e-12, s);
  ok('svd rank1 U orth', maxAbs(M.sub(M.mul(M.T(U), U), M.eye(2))) < 1e-10, U);
  ok('rank', M.rank(A) === 1 && M.rank(M.eye(3)) === 3);
  const F = M.svd([[1, 2, 3], [2, 4, 6]], { full: true });
  ok('svd full shapes', F.U.length === 2 && F.U[0].length === 2 && F.V.length === 3 && F.V[0].length === 3, [F.U.length, F.U[0].length, F.V.length, F.V[0].length]);
  ok('svd full V orth', maxAbs(M.sub(M.mul(M.T(F.V), F.V), M.eye(3))) < 1e-10);
  const P = M.pinv([[1, 2], [2, 4], [0, 0]]);
  ok('pinv', maxAbs(M.sub(M.mul(M.mul([[1, 2], [2, 4], [0, 0]], P), [[1, 2], [2, 4], [0, 0]]), [[1, 2], [2, 4], [0, 0]])) < 1e-10);
}
// 5. Schur and eig
{
  for (const [n, seed] of [[3, 4], [6, 5], [12, 6], [40, 7]]) {
    const A = M.randMat(n, n, seed);
    const Sch = M.schur(A);
    // A Q = Q T
    const [AQr, AQi] = cmul(A, M.zeros(n, n), toArr(Sch.Qr), toArr(Sch.Qi));
    const [QTr, QTi] = cmul(toArr(Sch.Qr), toArr(Sch.Qi), toArr(Sch.Tr), toArr(Sch.Ti));
    const err = Math.max(maxAbs(M.sub(AQr, QTr)), maxAbs(M.sub(AQi, QTi)));
    ok(`schur AQ=QT n=${n}`, err < 1e-9 * Math.max(1, M.normFro(A)), err);
    let lower = 0; for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) lower = Math.max(lower, Math.hypot(Sch.Tr[i][j], Sch.Ti[i][j]));
    ok(`schur triangular n=${n}`, lower < 1e-10 * M.normFro(A), lower);
    // trace and determinant consistency
    const sumRe = Sch.values.reduce((s, z) => s + z.re, 0);
    ok(`eig trace n=${n}`, close(sumRe, M.trace(A), 1e-8), [sumRe, M.trace(A)]);
    // eigenvectors
    const E = M.eig(A);
    let worst = 0;
    E.values.forEach((lam, k) => {
      const v = E.vectors[k];
      const Avr = M.mv(A, v.re), Avi = M.mv(A, v.im);
      const r = Avr.map((x, i) => Math.hypot(x - (lam.re * v.re[i] - lam.im * v.im[i]), Avi[i] - (lam.re * v.im[i] + lam.im * v.re[i])));
      worst = Math.max(worst, Math.max(...r));
    });
    ok(`eig vectors n=${n}`, worst < 1e-8 * Math.max(1, M.normFro(A)), worst);
  }
  // known spectra
  const R = [[0, -1], [1, 0]]; const ev = M.eigvals(R);
  ok('rotation eigs', ev.some(z => close(z.im, 1)) && ev.some(z => close(z.im, -1)), ev);
  const J = [[2, 1, 0], [0, 2, 1], [0, 0, 2]]; const ej = M.eigvals(J);
  ok('jordan eigs', ej.every(z => Math.abs(z.re - 2) < 1e-8 && Math.abs(z.im) < 1e-8), ej);
  const comp = [[0, 1, 0], [0, 0, 1], [6, -11, 6]]; // roots 1, 2, 3
  const ec = M.eigvals(comp).map(z => z.re).sort();
  ok('companion eigs', close(ec[0], 1, 1e-8) && close(ec[1], 2, 1e-8) && close(ec[2], 3, 1e-8), ec);
  const r = S.roots([1, -6, 11, -6]).map(z => z.re).sort();
  ok('roots', close(r[0], 1, 1e-8) && close(r[2], 3, 1e-8), r);
  // big random (timing)
  const t0 = Date.now(); const big = M.randMat(200, 200, 11); const eb = M.eigvals(big); const dt = Date.now() - t0;
  ok('eigvals 200 count', eb.length === 200);
  const sumB = eb.reduce((s, z) => s + z.re, 0); ok('eigvals 200 trace', close(sumB, M.trace(big), 1e-6), [sumB, M.trace(big)]);
  console.log('eigvals(200x200) ms:', dt);
}
// 6. eig2
{
  const e = M.eig2([[2, 1], [1, 2]]);
  ok('eig2 vals', close(e.values[0].re, 3) && close(e.values[1].re, 1));
  ok('eig2 vec', Math.abs(Math.abs(e.vectors[0][0]) - Math.SQRT1_2) < 1e-12);
  const s = M.eig2([[1, 1], [0, 1]]); ok('eig2 shear', s.real && close(s.values[0].re, 1) && s.vectors[0] !== null);
}
// 7. expm
{
  const th = 0.7, E = M.expm([[0, -th], [th, 0]]);
  ok('expm rotation', maxAbs(M.sub(E, M.rot(th))) < 1e-12, E);
  const N = [[0, 1], [0, 0]]; const En = M.expm(N); ok('expm nilpotent', maxAbs(M.sub(En, [[1, 1], [0, 1]])) < 1e-13);
  const A = [[-1, 5], [0, -2]]; const t = 1.3; const Et = M.expm(M.scale(A, t));
  const exact = [[Math.exp(-t), 5 * (Math.exp(-t) - Math.exp(-2 * t))], [0, Math.exp(-2 * t)]];
  ok('expm upper tri', maxAbs(M.sub(Et, exact)) < 1e-12, Et);
  const big = M.scale(M.randMat(5, 5, 21), 6); const Eb = M.expm(big), Eh = M.expm(M.scale(big, 0.5));
  ok('expm semigroup', maxAbs(M.sub(Eb, M.mul(Eh, Eh))) < 1e-8 * maxAbs(Eb), maxAbs(M.sub(Eb, M.mul(Eh, Eh))) / maxAbs(Eb));
}
// 8. Lyapunov
{
  const A = [[-1, 3, 0], [0, -2, 1], [0.5, 0, -1.5]], Q = [[1, 0, 0], [0, 2, 0], [0, 0, 1]];
  const X = M.lyap(A, Q); const res = M.add(M.add(M.mul(A, X), M.mul(X, M.T(A))), Q);
  ok('lyap residual', maxAbs(res) < 1e-11, maxAbs(res));
  const Ad = [[0.5, 0.3], [-0.2, 0.7]], Qd = M.eye(2); const Xd = M.dlyap(Ad, Qd);
  const rd = M.add(M.sub(M.mul(M.mul(Ad, Xd), M.T(Ad)), Xd), Qd); ok('dlyap residual', maxAbs(rd) < 1e-12, maxAbs(rd));
}
// 9. CARE / LQR
{
  const cases = [
    { A: [[0, 1], [0, 0]], B: [[0], [1]], Q: M.eye(2), R: [[1]] },
    { A: [[0, 1], [2, -0.5]], B: [[0], [1]], Q: [[10, 0], [0, 1]], R: [[0.1]] },
    { A: [[1, 2, 0], [0, -1, 1], [1, 0, 0.5]], B: [[1, 0], [0, 0], [0, 1]], Q: M.eye(3), R: M.eye(2) }
  ];
  cases.forEach((c, i) => {
    const P = M.care(c.A, c.B, c.Q, c.R); const r = M.careResidual(c.A, c.B, c.Q, c.R, P);
    ok(`care residual ${i}`, r < 1e-9 * (1 + M.normFro(P)), r);
    const K = M.mul(M.inv(c.R), M.mul(M.T(c.B), P)); const sa = M.spectralAbscissa(M.sub(c.A, M.mul(c.B, K)));
    ok(`care stabilizing ${i}`, sa < 0, sa);
  });
  // double integrator known: P = [[sqrt3, 1], [1, sqrt3]]
  const P = M.care([[0, 1], [0, 0]], [[0], [1]], M.eye(2), [[1]]);
  ok('care double integrator', maxAbs(M.sub(P, [[Math.sqrt(3), 1], [1, Math.sqrt(3)]])) < 1e-10, P);
  // scalar: a=1,b=1,q=1,r=1 -> p = 1 + sqrt2
  const p = M.care([[1]], [[1]], [[1]], [[1]]); ok('care scalar', close(p[0][0], 1 + Math.SQRT2), p);
}
// 10. DARE
{
  const A = [[1, 1], [0, 1]], B = [[0.5], [1]], Q = M.eye(2), R = [[1]];
  const P = M.dare(A, B, Q, R);
  const K = M.solve(M.add(R, M.mul(M.T(B), M.mul(P, B))), M.mul(M.T(B), M.mul(P, A)));
  const res = M.sub(P, M.add(Q, M.sub(M.mul(M.T(A), M.mul(P, A)), M.mul(M.mul(M.T(A), M.mul(P, B)), K))));
  ok('dare residual', maxAbs(res) < 1e-9, maxAbs(res));
  ok('dare stable', M.spectralRadius(M.sub(A, M.mul(B, K))) < 1);
}
// 11. sigminShift vs SVD of the real embedding
{
  const A = [[-1, 4, 0, 1], [0, -2, 3, 0], [0, 0, -1, 2], [0.3, 0, 0, -3]];
  const zs = [[0.5, 0.2], [-1.2, 1.0], [-2.5, -0.4]];
  zs.forEach(([zr, zi], k) => {
    const n = A.length, E = M.zeros(2 * n, 2 * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const re = (i === j ? zr : 0) - A[i][j], im = i === j ? zi : 0; E[i][j] = re; E[i][n + j] = -im; E[n + i][j] = im; E[n + i][n + j] = re; }
    const sv = M.svd(E).S; const smin = sv[sv.length - 1];
    const est = M.sigminShift(A, zr, zi, 30);
    ok(`sigmin ${k}`, close(est, smin, 1e-6), [est, smin]);
  });
  const A2 = [[-1, 5], [0, -2]];
  [[0.3, 0.1], [-1.5, 0.7]].forEach(([zr, zi], k) => {
    const E = [[zr + 1, -5, -zi, 0], [0, zr + 2, 0, -zi], [zi, 0, zr + 1, -5], [0, zi, 0, zr + 2]];
    const sv = M.svd(E).S; ok(`sigmin2 ${k}`, close(M.sigminShift(A2, zr, zi), sv[3], 1e-9), [M.sigminShift(A2, zr, zi), sv[3]]);
  });
}
// 12. Systems: freq, place, gramCt, c2d, tf2ss
{
  const A = [[0, 1], [-4, -0.4]], B = [[0], [1]], C = [[4, 0]];
  const w = 1.7, g = S.freq(A, B, C, 0, w);
  const exact = LT.cx.div({ re: 4, im: 0 }, { re: 4 - w * w, im: 0.4 * w });
  ok('freq', close(g.re, exact.re) && close(g.im, exact.im), [g, exact]);
  const K = S.place([[0, 1], [0, 0]], [[0], [1]], [{ re: -1, im: 1 }, { re: -1, im: -1 }]);
  const ev = M.eigvals(M.sub([[0, 1], [0, 0]], M.mul([[0], [1]], K)));
  ok('place', ev.every(z => close(z.re, -1, 1e-9) && close(Math.abs(z.im), 1, 1e-9)), [K, ev]);
  const K3 = S.place([[0, 1, 0], [0, 0, 1], [1, -2, 0.5]], [[0], [0], [1]], [-1, -2, -3]);
  const ev3 = M.eigvals(M.sub([[0, 1, 0], [0, 0, 1], [1, -2, 0.5]], M.mul([[0], [0], [1]], K3))).map(z => z.re).sort((a, b) => a - b);
  ok('place 3', close(ev3[0], -3, 1e-8) && close(ev3[2], -1, 1e-8), ev3);
  // Gramian: compare with numerical quadrature
  const Ag = [[-1, 2], [0, -0.5]], Bg = [[0], [1]], T = 2;
  const W = S.gramCt(Ag, Bg, T);
  let Wq = M.zeros(2, 2); const N = 4000;
  for (let k = 0; k <= N; k++) { const t = T * k / N; const E = M.expm(M.scale(Ag, t)); const v = M.mul(E, Bg); const wgt = (k === 0 || k === N) ? 0.5 : 1; Wq = M.add(Wq, M.scale(M.mul(v, M.T(v)), wgt * T / N)); }
  ok('gramCt', maxAbs(M.sub(W, Wq)) < 1e-6, [W, Wq]);
  const Winf = S.gramC(Ag, Bg); const Wbig = S.gramCt(Ag, Bg, 60); ok('gram inf', maxAbs(M.sub(Winf, Wbig)) < 1e-8, [Winf, Wbig]);
  const d = S.c2d([[0, 1], [0, 0]], [[0], [1]], 0.1);
  ok('c2d', close(d.Bd[0][0], 0.005) && close(d.Bd[1][0], 0.1) && close(d.Ad[0][1], 0.1));
  const ss = S.tf2ss([1, 3], [1, 2, 5]);
  const gs = S.freq(ss.A, ss.B, ss.C, ss.D, 0.8);
  const ge = LT.cx.div(S.polyval([1, 3], { re: 0, im: 0.8 }), S.polyval([1, 2, 5], { re: 0, im: 0.8 }));
  ok('tf2ss', close(gs.re, ge.re) && close(gs.im, ge.im), [gs, ge]);
  const pc = S.poly([{ re: -1, im: 2 }, { re: -1, im: -2 }, -3]);
  ok('poly', close(pc[1], 5) && close(pc[2], 11) && close(pc[3], 15), pc);
}
// 13. formatting
{
  ok('fmt minus', LT.fmt(-1.234, 2) === '−1.23', LT.fmt(-1.234, 2));
  ok('fmt negzero', LT.fmt(-0.0001, 2) === '0.00', LT.fmt(-0.0001, 2));
  ok('fmtC', LT.fmtC({ re: 1, im: -2 }, 1) === '1.0 − 2.0i', LT.fmtC({ re: 1, im: -2 }, 1));
}
// 14. 2x2 sigmin accuracy near an eigenvalue (cancellation-free)
{
  const A = [[-1, 5], [0, -2]];
  const z = -1 + 1e-8; // distance to eigenvalue -1 is 1e-8 along the real axis
  const exact = (() => { const E = [[z + 1, -5], [0, z + 2]]; const sv = M.svd(E).S; return sv[1]; })();
  const est = M.sigminShift(A, z, 0);
  ok('sigmin2 small', Math.abs(est - exact) <= 1e-6 * exact, [est, exact]);
}
console.log(`passed ${passes}, failed ${fails}`);
process.exit(fails ? 1 : 0);
