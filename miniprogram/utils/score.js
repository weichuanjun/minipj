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
  const lambda0 = 0.06; // baseline monthly hazard (entertainment only)
  let lambda = lambda0 * (1 + BHI / 50);
  const adjust = 1 / (1 + Math.sqrt((monthsTogether || 0) / 24));
  lambda *= adjust;
  const expect = 1 / lambda; // months
  const p50_low = Math.log(2 / 3) / (-lambda); // crude lower bound
  const p50_hi = Math.log(2) / lambda; // crude upper bound
  return { expectMonths: expect, range: [Math.max(1, p50_low), p50_hi] };
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
