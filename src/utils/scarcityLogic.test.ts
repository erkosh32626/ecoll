import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFoodSecurityProjection,
  calculateSelectedSolutionsImpact,
  clampPercent,
  getActiveValleyWaypoint,
  getCauseById,
} from './scarcityLogic';

test('clampPercent clamps out-of-range and non-finite inputs safely', () => {
  assert.equal(clampPercent(-25), 0);
  assert.equal(clampPercent(140), 100);
  assert.equal(clampPercent(48.6), 49);
  assert.equal(clampPercent(Number.NaN), 0);
});

test('calculateFoodSecurityProjection returns baseline 733M hungry at zero intervention', () => {
  const res = calculateFoodSecurityProjection({
    wasteReductionPercent: 0,
    climateAdaptationPercent: 0,
    conflictResolutionPercent: 0,
    waterEfficiencyPercent: 0,
  });
  assert.equal(res.remainingHungryMillions, 733);
  assert.equal(res.peopleLiftedMillions, 0);
  assert.equal(res.hungerReductionPercent, 0);
  assert.equal(res.valleyVitalityScore, 0.55);
});

test('calculateFoodSecurityProjection eliminates chronic hunger at 100% full intervention', () => {
  const res = calculateFoodSecurityProjection({
    wasteReductionPercent: 100,
    climateAdaptationPercent: 100,
    conflictResolutionPercent: 100,
    waterEfficiencyPercent: 100,
  });
  assert.equal(res.remainingHungryMillions, 0);
  assert.equal(res.peopleLiftedMillions, 733);
  assert.equal(res.hungerReductionPercent, 100);
  assert.equal(res.valleyVitalityScore, 1.6);
  assert.ok(res.savedGrainMillionTons > 1000);
});

test('getActiveValleyWaypoint wraps normalized progress and finds nearest station', () => {
  assert.equal(getActiveValleyWaypoint(0.02).id, 'wp-origin');
  assert.equal(getActiveValleyWaypoint(0.21).id, 'wp-conflict');
  assert.equal(getActiveValleyWaypoint(0.41).id, 'wp-climate');
  assert.equal(getActiveValleyWaypoint(0.99).id, 'wp-origin');
});

test('calculateSelectedSolutionsImpact sums selected solution actions accurately', () => {
  const empty = calculateSelectedSolutionsImpact([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.totalGrainMt, 0);

  const two = calculateSelectedSolutionsImpact(['cold-chain', 'drip-irrigation']);
  assert.equal(two.count, 2);
  assert.equal(two.totalGrainMt, 185 + 145);
  assert.equal(two.totalPeopleMillions, 140 + 115);
  assert.equal(two.totalWaterKm3, 210 + 480);
});

test('getCauseById finds matching cause or falls back to conflict', () => {
  assert.equal(getCauseById('climate').index, '02');
  assert.equal(getCauseById('waste').index, '04');
  assert.equal(getCauseById('unknown-id').id, 'conflict');
});
