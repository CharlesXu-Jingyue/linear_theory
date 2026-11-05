/* Table of contents and glossary for the Linear Theory study guide.
   The page shell (LT.page) builds the sidebar and prev/next links from LT_TOC;
   the hub page builds its chapter cards from it; tools/check.js uses LT_GLOSSARY
   to confirm every abbreviation is spelled out at first use on each page. */
window.LT_TOC = {
  title: 'Linear Theory',
  subtitle: 'From vector spaces to feedback',
  parts: [
    { id: 'I', name: 'Refresher: finite-dimensional linear algebra', short: 'Refresher', chapters: [
      { n: 1, file: 'ch01_linear_maps.html', title: 'Linear maps and the four fundamental subspaces', short: 'Linear maps and subspaces', q: 'When does Ax = b have a solution, and how many?' },
      { n: 2, file: 'ch02_least_squares.html', title: 'Inner products, projections and least squares', short: 'Projections and least squares', q: 'What is the best answer when Ax = b has none, and the smallest when it has many?' },
      { n: 3, file: 'ch03_eigenvalues.html', title: 'Eigenvalues, diagonalization and Jordan form', short: 'Eigenvalues and Jordan form', q: 'Which directions does a map not rotate, and what does Aᵏ do for large k?' },
      { n: 4, file: 'ch04_svd.html', title: 'Symmetric matrices, quadratic forms and the SVD', short: 'Symmetric matrices and SVD', q: 'What does an arbitrary matrix do geometrically, and how well can it be approximated?' }
    ] },
    { id: 'II', name: 'Linear analysis', short: 'Linear analysis', chapters: [
      { n: 5, file: 'ch05_hilbert_spaces.html', title: 'Beyond ℝⁿ: norms, operators and Hilbert space', short: 'Norms, operators, Hilbert space', q: 'Which facts about ℝⁿ survive for signals and functions?' },
      { n: 6, file: 'ch06_nonnormality.html', title: 'Perturbation, non-normality and pseudospectra', short: 'Non-normality and pseudospectra', q: 'When do eigenvalues mislead, and what replaces them?' }
    ] },
    { id: 'III', name: 'Linear dynamical systems', short: 'Dynamical systems', chapters: [
      { n: 7, file: 'ch07_autonomous_systems.html', title: 'Autonomous linear systems: flows, modes and stability', short: 'Flows, modes, stability', q: 'What can x′ = Ax do, and how is stability certified without solving it?' },
      { n: 8, file: 'ch08_input_output.html', title: 'Input–output systems: convolution, transfer functions and frequency response', short: 'Transfer functions', q: 'How does a linear system respond to inputs, and why do sinusoids diagonalize it?' }
    ] },
    { id: 'IV', name: 'Control', short: 'Control', chapters: [
      { n: 9, file: 'ch09_controllability.html', title: 'Controllability, observability and minimality', short: 'Controllability, observability', q: 'Can inputs steer the state anywhere, and can outputs reveal it?' },
      { n: 10, file: 'ch10_feedback.html', title: 'Feedback: state feedback, observers and the loop', short: 'Feedback and observers', q: 'How far can feedback reshape dynamics, and what does it cost?' },
      { n: 11, file: 'ch11_lqr_kalman.html', title: 'Optimal control and estimation: LQR, Kalman filter, LQG', short: 'LQR, Kalman filter, LQG', q: 'Which feedback minimizes a quadratic cost, and which estimate is best under noise?' },
      { n: 12, file: 'ch12_robustness.html', title: 'Robustness, fundamental limits and model reduction', short: 'Robustness and model reduction', q: 'How much model error can feedback tolerate, and which limits bind every controller?' }
    ] },
    { id: 'V', name: 'Bridges', short: 'Bridges', chapters: [
      { n: 13, file: 'ch13_neural_bridges.html', title: 'Linear theory in neural circuits and beyond', short: 'Neural circuits and beyond', q: 'What do linear tools explain about recurrent neural dynamics, and how do they reach past linear systems?' }
    ] }
  ],
  extras: [
    { file: 'notation.html', title: 'Notation and abbreviations' }
  ]
};

/* [abbreviation, expansion]. The checker requires the expansion to appear (case-insensitive) within a short
   window before or after the first use of the abbreviation in each page's main text. */
window.LT_GLOSSARY = [
  ['SVD', 'singular value decomposition'],
  ['PD', 'positive definite'],
  ['PSD', 'positive semidefinite'],
  ['DFT', 'discrete Fourier transform'],
  ['FFT', 'fast Fourier transform'],
  ['ODE', 'ordinary differential equation'],
  ['CT', 'continuous time'],
  ['DT', 'discrete time'],
  ['LTI', 'linear time-invariant'],
  ['LTV', 'linear time-varying'],
  ['SISO', 'single-input single-output'],
  ['MIMO', 'multiple-input multiple-output'],
  ['BIBO', 'bounded-input bounded-output'],
  ['PBH', 'Popov–Belevitch–Hautus'],
  ['LQR', 'linear quadratic regulator'],
  ['LQE', 'linear quadratic estimator'],
  ['LQG', 'linear quadratic Gaussian'],
  ['CARE', 'continuous-time algebraic Riccati equation'],
  ['DARE', 'discrete-time algebraic Riccati equation'],
  ['HJB', 'Hamilton–Jacobi–Bellman'],
  ['RHP', 'right half-plane'],
  ['LHP', 'left half-plane'],
  ['PID', 'proportional–integral–derivative'],
  ['DMD', 'dynamic mode decomposition'],
  ['SLS', 'system level synthesis'],
  ['RNN', 'recurrent neural network'],
  ['PCA', 'principal component analysis'],
  ['LMI', 'linear matrix inequality'],
  ['DC', 'direct current'],
  ['BCI', 'brain–computer interface'],
  ['dB', 'decibel'],
  ['GM', 'gain margin'],
  ['PM', 'phase margin'],
  ['IRLS', 'iteratively reweighted least squares'],
  ['E/I', 'excitatory and inhibitory'],
  ['SOC', 'stability-optimized circuit'],
  ['i.i.d.', 'independent and identically distributed']
];
