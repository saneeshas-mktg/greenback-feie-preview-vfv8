/*
 * Scenario tests. Run with: node tests/scenarios.test.js
 * Each scenario lists the answers a reader gives and the result they must land on.
 * Nahuel: run these against the live build too (same answers, same result letter and figures).
 */
const assert = require('assert');
const L = require('../src/logic.js');

const base = { status: 'citizen', year: '2026', where: 'oneCountry', days: '330plus', payer: 'foreignCo', filing: 'single', income: 'b7', otherIncome: 'none', children: '0' };
const S = [
  // Exits before any math
  { name: 'Not a U.S. citizen or green card holder', a: { status: 'neither' }, result: 'A', reason: 'status' },
  { name: 'Late filer, earlier year', a: { status: 'citizen', year: 'earlier' }, result: 'B', reason: 'late' },
  { name: 'Digital nomad with no home base', a: { ...base, where: 'noBase' }, result: 'B', reason: 'nomad' },
  { name: 'Still living in the U.S.', a: { ...base, where: 'us' }, result: 'A', reason: 'us' },
  { name: 'Under 330 days, no full calendar year', a: { ...base, days: '300to329', fullYear: 'no' }, result: 'A', reason: 'days' },
  { name: 'Under 330 days but a full calendar year (bona fide residence)', a: { ...base, days: 'under300', fullYear: 'yes', foreignTax: '10to20' }, result: 'E', reason: 'foreignTax' },
  { name: 'Paid only by the U.S. government', a: { ...base, payer: 'gov' }, result: 'A', reason: 'gov' },
  { name: 'Has rental income', a: { ...base, otherIncome: 'rental' }, result: 'B', reason: 'other' },
  // Math results
  { name: 'Single, $50k to $75k, 2026: below the no-tax line', a: { ...base, income: 'b2' }, result: 'C' },
  { name: 'Single, $125k to $150k, 2026: top of band is $1,000 over the line, estimate rounds to $0, so C', a: { ...base, income: 'b5' }, result: 'C' },
  { name: 'Single, $150k to $175k, 2026: above the line, Q10 asked', a: { ...base, income: 'b6', foreignTax: 'under10' }, result: 'D', feie: [0, 6000] },
  { name: 'Single, $175k to $200k, 2026, low foreign tax (e.g. UAE)', a: { ...base, foreignTax: 'under10' }, result: 'D', feie: [6000, 12000] },
  { name: 'Single, $175k to $200k, 2026, over 20% foreign tax (e.g. Spain)', a: { ...base, foreignTax: 'over20' }, result: 'E', feie: [6000, 12000], ftc: [0, 0] },
  { name: 'Married jointly, both work abroad, $250k to $300k, 2026: band top is above the $298,000 line', a: { ...base, filing: 'mfj', spouseAbroad: 'yes', income: 'b9', foreignTax: 'under10' }, result: 'D' },
  { name: 'Married jointly, both work abroad, $200k to $250k, 2026: below the $298,000 line', a: { ...base, filing: 'mfj', spouseAbroad: 'yes', income: 'b8' }, result: 'C' },
  { name: 'Married jointly, one earner, $175k to $200k, 2026', a: { ...base, filing: 'mfj', spouseAbroad: 'no', foreignTax: '10to20' }, result: 'E' },
  { name: 'Parent with 2 children goes to E without Q10', a: { ...base, children: '2' }, result: 'E', reason: 'children' },
  { name: 'Self-employed in Thailand, $75k to $100k, 2026: $0 income tax but SE tax shown', a: { ...base, payer: 'self', income: 'b3' }, result: 'C' },
  { name: 'Moved abroad in July 2026, $50k U.S. pay before the move, $75k to $100k abroad', a: { ...base, where: 'moved', moveMonth: '7', usPay: 'u2', income: 'b3', foreignTax: 'under10' }, result: 'D' },
  { name: '2025 tax year, single, $150k to $175k, uses $130,000 limit', a: { ...base, year: '2025', income: 'b6', foreignTax: 'under10' }, result: 'D' },
  { name: 'Over $300,000 shows an open-ended figure', a: { ...base, income: 'b10', foreignTax: 'notSure' }, result: 'E' },
];

let pass = 0;
for (const s of S) {
  const w = L.walk(s.a);
  try {
    assert.ok(w.outcome, 'no result reached; stuck at question ' + w.current);
    assert.strictEqual(w.outcome.result, s.result);
    if (s.reason) assert.strictEqual(w.outcome.reason, s.reason);
    const r = L.buildResult(s.a, w.outcome);
    if (s.feie) { const rr = L.rangeFor(s.a); assert.deepStrictEqual(rr.feie, s.feie, 'FEIE range ' + JSON.stringify(rr.feie)); }
    if (s.ftc) { const rr = L.rangeFor(s.a); assert.deepStrictEqual(rr.ftc, s.ftc, 'FTC range ' + JSON.stringify(rr.ftc)); }
    pass++;
    console.log('PASS', s.result, '|', s.name, r.figures.length ? '| ' + r.figures.map(f => f.label + ': ' + f.value).join(' ; ') : '');
  } catch (e) { console.log('FAIL', s.name, '->', e.message); }
}

// The test case from the competitor review: single, $175,000, 2026, 330 days, Spain.
const t = L.estimate({ year: '2026', filing: 'single', foreignIncome: 175000, usIncome: 0, children: 0, selfEmployed: false, foreignTaxRate: 0.25 });
assert.strictEqual(Math.round(t.feieTax), 6240); assert.strictEqual(t.ftcTax, 0);
console.log('PASS exact | single $175,000 2026: $6,240 with the FEIE alone, $0 once Spanish tax is credited');
// No-tax lines
const lines = [['2026', 'single', 'no', 149000], ['2026', 'hoh', 'no', 157050], ['2026', 'mfj', 'no', 165100], ['2026', 'mfj', 'yes', 298000], ['2025', 'single', 'no', 145750], ['2025', 'hoh', 'no', 153625], ['2025', 'mfj', 'no', 161500], ['2025', 'mfj', 'yes', 291500]];
for (const [year, filing, spouseAbroad, want] of lines) assert.strictEqual(L.noTaxLine({ year, filing, spouseAbroad }), want);
console.log('PASS no-tax lines for 2025 and 2026');
console.log(`\n${pass}/${S.length} scenarios passed`);
if (pass !== S.length) process.exit(1);
