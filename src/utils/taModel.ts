// Takahashi-Alexander fund cash flow model.
//
// Source: Takahashi & Alexander, "Illiquid Alternative Asset Fund Modeling",
// Yale University Investments Office, Journal of Portfolio Management 28(2),
// 2002. The industry-standard pacing model (used by Burgiss/MSCI, Two Sigma
// Venn, Preqin, BlackRock).
//
//   Contributions:  C(t) = commitment × (deployment(t) − deployment(t−1))
//   Distributions:  D(t) = (t/L)^bow × NAV(t−1)·(1+G)
//   NAV:            NAV(t) = NAV(t−1)·(1+G) + C(t) − D(t)
//
// Yield floor Y = 0 (venture/buyout). At t = L the distribution rate is 1, so
// the fund fully liquidates at the end of its life. The growth rate G is
// solved numerically so that total distributions equal the target gross
// multiple on committed capital — TVPI is the user input; everything else
// (NAV marks, DPI path, years to return 1x) is derived.

import { getDeploymentAtYear } from './calculations';

export interface TASchedule {
  years: number;                // fund life L (integer simulation steps)
  cumDistributions: number[];   // [0..L] cumulative distributions, $M
  nav: number[];                // [0..L] NAV at end of each year, $M
  totalDistributions: number;   // = multiple × commitment
  growthRate: number;           // solved G (equals the fund's IRR in this model)
  yearsTo1X: number;            // interpolated year when cumD crosses commitment (Infinity if never)
}

interface TAParams {
  fundSize: number;
  multiple: number;
  years: number;
  bow: number;
  deploymentCurve: number[];
  deploymentTimeline: number;
}

function simulate(params: TAParams, growthRate: number): { cumDistributions: number[]; nav: number[] } {
  const { fundSize, years, bow, deploymentCurve, deploymentTimeline } = params;
  const L = Math.max(1, Math.round(years));

  const cumDistributions: number[] = [0];
  const nav: number[] = [0];
  let cumD = 0;
  let currentNav = 0;
  let prevDeployment = 0;

  for (let t = 1; t <= L; t++) {
    const deployment = getDeploymentAtYear(t, deploymentCurve, deploymentTimeline);
    const contribution = fundSize * Math.max(0, deployment - prevDeployment);
    prevDeployment = Math.max(prevDeployment, deployment);

    const grownNav = currentNav * (1 + growthRate);
    const distributionRate = Math.min(1, Math.pow(t / L, bow));
    const distribution = distributionRate * grownNav;

    currentNav = grownNav + contribution - distribution;
    cumD += distribution;

    cumDistributions.push(cumD);
    nav.push(Math.max(0, currentNav));
  }

  return { cumDistributions, nav };
}

// Total distributions are strictly increasing in G, so bisect G until the
// fund's lifetime TVPI matches the target multiple.
function solveGrowthRate(params: TAParams): number {
  const target = params.multiple * params.fundSize;
  let lo = -0.99;
  let hi = 3.0;

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const { cumDistributions } = simulate(params, mid);
    const total = cumDistributions[cumDistributions.length - 1];
    if (total < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}

const scheduleCache = new Map<string, TASchedule>();

export function getTASchedule(params: TAParams): TASchedule {
  const key = [
    params.fundSize,
    params.multiple,
    params.years,
    params.bow,
    params.deploymentTimeline,
    params.deploymentCurve.join(','),
  ].join('|');

  const cached = scheduleCache.get(key);
  if (cached) return cached;

  let schedule: TASchedule;

  if (params.multiple <= 0 || params.fundSize <= 0) {
    const L = Math.max(1, Math.round(params.years));
    schedule = {
      years: L,
      cumDistributions: new Array(L + 1).fill(0),
      nav: new Array(L + 1).fill(0),
      totalDistributions: 0,
      growthRate: -1,
      yearsTo1X: Infinity,
    };
  } else {
    const growthRate = solveGrowthRate(params);
    const { cumDistributions, nav } = simulate(params, growthRate);
    const L = cumDistributions.length - 1;

    // Interpolate the year cumulative distributions cross committed capital
    let yearsTo1X = Infinity;
    for (let t = 1; t <= L; t++) {
      if (cumDistributions[t] >= params.fundSize) {
        const prev = cumDistributions[t - 1];
        const gap = cumDistributions[t] - prev;
        yearsTo1X = gap > 0 ? t - 1 + (params.fundSize - prev) / gap : t;
        break;
      }
    }

    schedule = {
      years: L,
      cumDistributions,
      nav,
      totalDistributions: cumDistributions[L],
      growthRate,
      yearsTo1X,
    };
  }

  // Bounded cache: enough for any realistic number of funds × scenarios
  if (scheduleCache.size > 500) scheduleCache.clear();
  scheduleCache.set(key, schedule);
  return schedule;
}

// Linear interpolation into an annual series; clamps outside [0, L]
export function interpolateSchedule(series: number[], year: number): number {
  if (year <= 0) return series[0];
  const L = series.length - 1;
  if (year >= L) return series[L];
  const lower = Math.floor(year);
  const fraction = year - lower;
  return series[lower] + (series[lower + 1] - series[lower]) * fraction;
}
