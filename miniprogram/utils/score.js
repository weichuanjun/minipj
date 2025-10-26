function scoreLikert(value, reverse = false) {
  const v = Number(value || 0);
  if (!v) return 0; // unanswered treated as 0
  const s = reverse ? (6 - v) : v; // 1..5
  return ((s - 1) / 4) * 100; // map to 0..100
}

function redflagMultiplier(flags) {
  let m = 1.0;
  for (const f of flags || []) {
    if (!f || !f.checked) continue;
    if (f.severity === 'mid') m *= 1.1;
    if (f.severity === 'high') m *= 1.25;
  }
  return m;
}

function computeBHI(dimScores, weights, flags) {
  // Use only structural dims for S (exclude redflags)
  const keys = Object.keys(weights || {}).filter(k => k !== 'redflags' && (k in dimScores));
  const total = keys.reduce((acc, k) => acc + (weights[k] || 0), 0) || 100;
  const S = keys.reduce((acc, k) => acc + ((dimScores[k] || 0) * (weights[k] || 0)), 0) / total;
  const M = redflagMultiplier(flags);
  const raw = M * (100 - S);
  const BHI = Math.min(100, Math.max(0, raw));
  const hasSafety = (flags || []).some(f => f.checked && f.severity === 'high');
  return { S, M, BHI, hasSafety };
}

function estimateMonthsLeft(BHI, monthsTogether = 0) {
  // Softer, less pessimistic hazard model (entertainment only)
  // Baseline monthly hazard
  const lambda0 = 0.03; // reduced baseline
  // Nonlinear risk scaling, tame extremes
  const risk = Math.pow((BHI || 0) / 100, 1.2); // 0..~1
  let lambda = lambda0 * (1 + 2.0 * risk); // 0.03..~0.09
  // Relationship age dampening（越久越稳定，衰减更显著）
  const adjust = 1 / (1 + Math.sqrt((monthsTogether || 0) / 36));
  lambda *= adjust;
  // Reference window: P25~P75 rather than P50 bounds
  const p = (q) => -Math.log(1 - q) / lambda;
  const p25 = p(0.25);
  const p75 = p(0.75);
  const expect = 1 / lambda;
  return { expectMonths: expect, range: [Math.max(1, p25), p75] };
}

function roundRange(range) {
  const l = Math.max(1, Math.round(range[0]));
  const h = Math.max(l, Math.round(range[1]));
  return [l, h];
}

module.exports = {
  scoreLikert,
  redflagMultiplier,
  computeBHI,
  estimateMonthsLeft,
  roundRange,
};
