import {
  GLOBAL_HUNGER_OVERVIEW,
  SCARCITY_CAUSES,
  SOLUTION_ACTIONS,
  VALLEY_WAYPOINTS,
  ScarcityCause,
  ValleyWaypoint,
} from '../data/hungerData';

export interface SimulatorInputs {
  /** Percentage of global food waste cut (0 - 100) */
  wasteReductionPercent: number;
  /** Percentage adoption of climate-resilient crops & soil restoration (0 - 100) */
  climateAdaptationPercent: number;
  /** Percentage restoration of peaceful trade & humanitarian grain corridors (0 - 100) */
  conflictResolutionPercent: number;
  /** Percentage adoption of precision drip irrigation & water conservation (0 - 100) */
  waterEfficiencyPercent: number;
}

export interface SimulatorResult {
  remainingHungryMillions: number;
  peopleLiftedMillions: number;
  hungerReductionPercent: number;
  savedGrainMillionTons: number;
  savedWaterKm3: number;
  valleyVitalityScore: number; // 0.35 to 1.65 multiplier for 3D valley bloom density
  statusLabel: string;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Calculates the real-world food security impact from the 4 policy/ecological levers.
 */
export function calculateFoodSecurityProjection(inputs: SimulatorInputs): SimulatorResult {
  const waste = clampPercent(inputs.wasteReductionPercent) / 100;
  const climate = clampPercent(inputs.climateAdaptationPercent) / 100;
  const peace = clampPercent(inputs.conflictResolutionPercent) / 100;
  const water = clampPercent(inputs.waterEfficiencyPercent) / 100;

  const baselineHungry = GLOBAL_HUNGER_OVERVIEW.chronicHungerMillions; // 733M

  // Weighted contributions grounded in FAO / WFP driver proportions
  const liftedByPeace = peace * 265;
  const liftedByClimate = climate * 185;
  const liftedByWaste = waste * 165;
  const liftedByWater = water * 118;

  const rawLifted = liftedByPeace + liftedByClimate + liftedByWaste + liftedByWater;
  const peopleLiftedMillions = Math.min(baselineHungry, Math.round(rawLifted));
  const remainingHungryMillions = Math.max(0, baselineHungry - peopleLiftedMillions);
  const hungerReductionPercent = Math.round((peopleLiftedMillions / baselineHungry) * 100);

  const savedGrainMillionTons = Math.round(
    waste * 650 + climate * 240 + peace * 190 + water * 150
  );
  const savedWaterKm3 = Math.round(
    water * 520 + waste * 280 + climate * 210 + peace * 75
  );

  // Valley vitality score scales from 0.55 (at 0% action) up to 1.60 (at 100% action)
  const averageLever = (waste + climate + peace + water) / 4;
  const valleyVitalityScore = Number((0.55 + averageLever * 1.05).toFixed(2));

  let statusLabel = 'Дағдарыстық тапшылық деңгейі';
  if (hungerReductionPercent >= 85) {
    statusLabel = 'Толық азық-түлік тұрақтылығы мен молшылық';
  } else if (hungerReductionPercent >= 55) {
    statusLabel = 'Тұрақты қалпына келу және тапшылықтың төмендеуі';
  } else if (hungerReductionPercent >= 25) {
    statusLabel = 'Ішінара жеңілдеу — жүйелі реформалар қажет';
  }

  return {
    remainingHungryMillions,
    peopleLiftedMillions,
    hungerReductionPercent,
    savedGrainMillionTons,
    savedWaterKm3,
    valleyVitalityScore,
    statusLabel,
  };
}

/**
 * Finds the closest waypoint along the normalized [0, 1) valley camera path.
 */
export function getActiveValleyWaypoint(progress: number): ValleyWaypoint {
  const norm = ((progress % 1) + 1) % 1;
  let best = VALLEY_WAYPOINTS[0];
  let bestDist = Infinity;

  for (const wp of VALLEY_WAYPOINTS) {
    const direct = Math.abs(norm - wp.progress);
    const wrapped = 1 - direct;
    const dist = Math.min(direct, wrapped);
    if (dist < bestDist) {
      bestDist = dist;
      best = wp;
    }
  }
  return best;
}

/**
 * Computes cumulative impact of selected solution pledges.
 */
export function calculateSelectedSolutionsImpact(selectedIds: string[]): {
  totalGrainMt: number;
  totalPeopleMillions: number;
  totalWaterKm3: number;
  count: number;
} {
  const set = new Set(selectedIds);
  let totalGrainMt = 0;
  let totalPeopleMillions = 0;
  let totalWaterKm3 = 0;
  let count = 0;

  for (const action of SOLUTION_ACTIONS) {
    if (set.has(action.id)) {
      totalGrainMt += action.annualGrainSavedMt;
      totalPeopleMillions += action.peopleFedMillions;
      totalWaterKm3 += action.waterSavedKm3;
      count += 1;
    }
  }

  return {
    totalGrainMt,
    totalPeopleMillions,
    totalWaterKm3,
    count,
  };
}

/**
 * Retrieves a cause by id, defaulting to the first cause if not found.
 */
export function getCauseById(id: string): ScarcityCause {
  return SCARCITY_CAUSES.find((c) => c.id === id) ?? SCARCITY_CAUSES[0];
}
