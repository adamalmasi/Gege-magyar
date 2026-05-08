// tests/logic.test.js
const assert = require('assert');
const { assembleRandomTest, gradeExact, computeTotalMax } = require('../js/logic.js');

const mockFeladatlapok = [
  {
    year: 2023, variant: 1,
    tasks: [
      { id: 1, maxPoints: 1, subTasks: [{ id: 'a', answer: 'denevér', points: 1 }], scoring: 'all_or_nothing', gradingType: 'exact' },
      { id: 2, maxPoints: 2, subTasks: [{ id: 'a', answer: 'igaz', points: 1 }, { id: 'b', answer: 'hamis', points: 1 }], scoring: 'per_item', gradingType: 'exact' }
    ]
  },
  {
    year: 2022, variant: 1,
    tasks: [
      { id: 1, maxPoints: 1, subTasks: [{ id: 'a', answer: 'macska', points: 1 }], scoring: 'all_or_nothing', gradingType: 'exact' },
      { id: 2, maxPoints: 3, subTasks: [{ id: 'a', answer: 'A', points: 1 }, { id: 'b', answer: 'B', points: 1 }, { id: 'c', answer: 'C', points: 1 }], scoring: 'per_item', gradingType: 'open' }
    ]
  }
];

// assembleRandomTest: minden pozícióból 1 feladat
const test1 = assembleRandomTest(mockFeladatlapok);
assert.strictEqual(test1.length, 2, 'Length should match number of positions');
assert.ok([1].includes(test1[0].id), 'Position 0 task id should be 1');
assert.ok([2].includes(test1[1].id), 'Position 1 task id should be 2');

// gradeExact — all_or_nothing helyes
const t1 = mockFeladatlapok[0].tasks[0];
const r1 = gradeExact(t1, { a: 'denevér' });
assert.strictEqual(r1.scored, 1, 'all_or_nothing correct: scored=1');

// gradeExact — all_or_nothing helytelen
const r2 = gradeExact(t1, { a: 'kutya' });
assert.strictEqual(r2.scored, 0, 'all_or_nothing wrong: scored=0');

// gradeExact — all_or_nothing nagybetű-érzéketlen
const r3 = gradeExact(t1, { a: 'Denevér' });
assert.strictEqual(r3.scored, 1, 'all_or_nothing case-insensitive: scored=1');

// gradeExact — per_item részpontozás
const t2 = mockFeladatlapok[0].tasks[1];
const r4 = gradeExact(t2, { a: 'igaz', b: 'WRONG' });
assert.strictEqual(r4.scored, 1, 'per_item partial: scored=1');

// gradeExact — per_item mind helyes
const r5 = gradeExact(t2, { a: 'igaz', b: 'hamis' });
assert.strictEqual(r5.scored, 2, 'per_item all correct: scored=2');

// computeTotalMax
assert.strictEqual(computeTotalMax([t1, t2]), 3, 'Total max = sum of maxPoints');

// tiered scoring
const tieredTask = {
  id: 3, maxPoints: 3, scoring: 'tiered',
  tiers: [[4, 3], [2, 2], [1, 1], [0, 0]],
  subTasks: [
    { id: 'a', answer: 'x', points: 1 }, { id: 'b', answer: 'y', points: 1 },
    { id: 'c', answer: 'z', points: 1 }, { id: 'd', answer: 'w', points: 1 }
  ],
  gradingType: 'exact'
};
const r6 = gradeExact(tieredTask, { a: 'x', b: 'y', c: 'WRONG', d: 'WRONG' });
assert.strictEqual(r6.scored, 2, 'tiered: 2 correct → 2 points');
const r7 = gradeExact(tieredTask, { a: 'x', b: 'y', c: 'z', d: 'w' });
assert.strictEqual(r7.scored, 3, 'tiered: 4 correct → 3 points');

console.log('✅ All logic tests passed!');
