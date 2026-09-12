/**
 * Statistical utilities for Human vs. G-Eval correlation analysis.
 */

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) {
    // If both arrays are invariant and equal
    return meanX === meanY ? 1 : 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

export function calculateRanks(values: number[]): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    // Find ties
    while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    // Average rank for ties (1-based rank)
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }

  return ranks;
}

export function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const ranksX = calculateRanks(x);
  const ranksY = calculateRanks(y);
  return calculatePearsonCorrelation(ranksX, ranksY);
}

export function calculateMAE(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const totalDiff = x.reduce((sum, val, idx) => sum + Math.abs(val - y[idx]), 0);
  return Number((totalDiff / x.length).toFixed(3));
}
