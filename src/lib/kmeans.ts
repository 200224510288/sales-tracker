export type KMeansResult = {
  labels: number[]; // cluster id per point
  centroids: number[][];
};

function distance2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

function mean(points: number[][], dim: number): number[] {
  const m = Array(dim).fill(0);
  if (points.length === 0) return m;

  for (const p of points) {
    for (let i = 0; i < dim; i++) m[i] += p[i];
  }
  for (let i = 0; i < dim; i++) m[i] /= points.length;
  return m;
}

export function kmeans(
  X: number[][],
  k: number,
  maxIter = 50
): KMeansResult {
  const n = X.length;
  const dim = X[0]?.length ?? 0;
  if (n === 0 || dim === 0) return { labels: [], centroids: [] };

  // init centroids (random unique picks)
  const used = new Set<number>();
  const centroids: number[][] = [];
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!used.has(idx)) {
      used.add(idx);
      centroids.push([...X[idx]]);
    }
  }

  const labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // assign
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distance2(X[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed = true;
      }
    }

    // recompute
    const buckets: number[][][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) buckets[labels[i]].push(X[i]);

    for (let c = 0; c < k; c++) {
      if (buckets[c].length > 0) centroids[c] = mean(buckets[c], dim);
    }

    if (!changed) break;
  }

  return { labels, centroids };
}