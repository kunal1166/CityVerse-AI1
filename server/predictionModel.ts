/**
 * PREDICTION MODEL - simple linear regression
 *
 * Replaces the fake "Neural Mobility Net v2.4" with something you can explain
 * in one sentence: we fit a straight line through observed rainfall vs traffic,
 * then read predicted values off that line using forecast rainfall.
 *
 * This file is PURE: no network, no dates, no side effects. Same input, same
 * output, every time - which is why it can be tested on its own.
 *
 * It is NOT machine learning. Do not call it machine learning.
 */

export interface Fit {
  slope: number;      // change in y per 1 unit of x (e.g. km/h lost per mm/h of rain)
  intercept: number;  // value of y when x = 0 (e.g. speed on a dry hour)
  r: number;          // -1..1, how well the line fits. Reported, never used to predict.
  n: number;          // sample size. Small n = weak claim. Always show it.
}

export interface PredictionModel {
  speedFit: Fit;
  congestionFit: Fit;
  rainfallMin: number;
  rainfallMax: number;
  speedMin: number;
  speedMax: number;
}

export interface Prediction {
  hoursAhead: number;
  time: string;
  rainfall: number;
  predictedSpeed: number;
  predictedCongestion: number;
  extrapolated: boolean; // true if forecast rain is outside the observed range
}

/**
 * Least-squares fit of y = slope*x + intercept.
 * Returns null when x has no variance (e.g. a completely dry series) - you
 * cannot fit a line through a vertical stack of points, and pretending you
 * can is how fake models get built.
 */
function fitLinear(xs: number[], ys: number[]): Fit | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  if (sxx === 0) return null; // no variation in rainfall -> no relationship to find

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const denom = Math.sqrt(sxx * syy);
  const r = denom === 0 ? 0 : sxy / denom;

  return {
    slope: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(2)),
    r: Number(r.toFixed(2)),
    n,
  };
}

/** Build the model from observed telemetry. Returns null if it cannot be fitted. */
export function buildModel(
  trends: { rainfall: number; avgSpeed: number; congestion: number }[],
): PredictionModel | null {
  if (!trends || trends.length < 3) return null;

  const rainfall = trends.map((t) => t.rainfall);
  const speed = trends.map((t) => t.avgSpeed);
  const congestion = trends.map((t) => t.congestion);

  const speedFit = fitLinear(rainfall, speed);
  const congestionFit = fitLinear(rainfall, congestion);
  if (!speedFit || !congestionFit) return null;

  return {
    speedFit,
    congestionFit,
    rainfallMin: Math.min(...rainfall),
    rainfallMax: Math.max(...rainfall),
    speedMin: Math.min(...speed),
    speedMax: Math.max(...speed),
  };
}

/**
 * Project one forecast hour through the fitted lines.
 *
 * Clamping matters: a linear model extended far past its training range will
 * happily predict negative speed. We bound outputs to physically sane values
 * and flag when we've stepped outside the data we actually observed.
 */
export function predict(
  model: PredictionModel,
  hour: { time: string; precipitation: number },
  hoursAhead: number,
): Prediction {
  const rain = Math.max(0, hour.precipitation);

  const rawSpeed = model.speedFit.slope * rain + model.speedFit.intercept;
  const rawCongestion = model.congestionFit.slope * rain + model.congestionFit.intercept;

  // Never predict below 5 km/h or above the fastest hour we've actually seen.
  const predictedSpeed = Math.min(model.speedMax, Math.max(5, rawSpeed));
  const predictedCongestion = Math.min(100, Math.max(0, rawCongestion));

  return {
    hoursAhead,
    time: hour.time,
    rainfall: Number(rain.toFixed(1)),
    predictedSpeed: Number(predictedSpeed.toFixed(1)),
    predictedCongestion: Math.round(predictedCongestion),
    extrapolated: rain > model.rainfallMax,
  };
}

/** One-line, demo-safe description of the model. Shown instead of a fake name. */
export function describeModel(model: PredictionModel): string {
  const f = model.speedFit;
  return `Linear regression - rainfall vs speed (slope ${f.slope} km/h per mm/h, r = ${f.r}, n = ${f.n})`;
}