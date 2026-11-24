/*
 * IRS figures by tax year. This is the ONLY place figures live.
 * Update every November when the IRS publishes next year's inflation adjustments.
 *
 * Sources (checked Nov 24, 2026):
 *  - FEIE limit: https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion
 *  - 2025 brackets: https://www.irs.gov/filing/federal-income-tax-rates-and-brackets
 *  - 2026 brackets, FEIE, child tax credit: Rev. Proc. 2025-32 https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
 *  - Standard deduction 2025 and 2026: https://www.irs.gov/newsroom/working-families-tax-cuts-individuals-and-workers
 *  - Social Security wage base: https://www.ssa.gov/oact/cola/cbb.html
 *
 * Brackets are listed as [upper limit of bracket, rate]. The last bracket has no upper limit (Infinity).
 */
(function (root) {
  const FIGURES = {
    2025: {
      feieLimit: 130000,
      daysInYear: 365,
      standardDeduction: { single: 15750, hoh: 23625, mfs: 15750, mfj: 31500 },
      childTaxCredit: 2200,
      ssWageBase: 176100,
      brackets: {
        single: [[11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [Infinity, 0.37]],
        mfs:    [[11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [375800, 0.35], [Infinity, 0.37]],
        hoh:    [[17000, 0.10], [64850, 0.12], [103350, 0.22], [197300, 0.24], [250500, 0.32], [626350, 0.35], [Infinity, 0.37]],
        mfj:    [[23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]],
      },
    },
    2026: {
      feieLimit: 132900,
      daysInYear: 365,
      standardDeduction: { single: 16100, hoh: 24150, mfs: 16100, mfj: 32200 },
      childTaxCredit: 2200,
      ssWageBase: 184500,
      brackets: {
        single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
        mfs:    [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [384350, 0.35], [Infinity, 0.37]],
        hoh:    [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]],
        mfj:    [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
      },
    },
  };

  // Self-employment tax rates (unchanged by year).
  const SE = { netEarningsFactor: 0.9235, socialSecurityRate: 0.124, medicareRate: 0.029 };

  // Income bands used by Q7 (earned abroad) and the movers' follow-up (U.S. pay before the move).
  // "Over $300,000" is estimated from $300,000 and shown as "at least".
  const INCOME_BANDS = [
    { id: 'b1', label: 'Under $50,000', lo: 0, hi: 50000 },
    { id: 'b2', label: '$50,000 to $75,000', lo: 50000, hi: 75000 },
    { id: 'b3', label: '$75,000 to $100,000', lo: 75000, hi: 100000 },
    { id: 'b4', label: '$100,000 to $125,000', lo: 100000, hi: 125000 },
    { id: 'b5', label: '$125,000 to $150,000', lo: 125000, hi: 150000 },
    { id: 'b6', label: '$150,000 to $175,000', lo: 150000, hi: 175000 },
    { id: 'b7', label: '$175,000 to $200,000', lo: 175000, hi: 200000 },
    { id: 'b8', label: '$200,000 to $250,000', lo: 200000, hi: 250000 },
    { id: 'b9', label: '$250,000 to $300,000', lo: 250000, hi: 300000 },
    { id: 'b10', label: 'Over $300,000', lo: 300000, hi: 300000, openEnded: true },
  ];

  const US_PAY_BANDS = [{ id: 'u0', label: 'None', lo: 0, hi: 0 }].concat(INCOME_BANDS.map(b => Object.assign({}, b, { id: 'u' + b.id.slice(1) })));

  // Foreign income tax as a share of pay (Q10). Used for the "with foreign tax credited" range.
  const FOREIGN_TAX_BANDS = {
    under10: { lo: 0, hi: 0.10 },
    '10to20': { lo: 0.10, hi: 0.20 },
    over20: { lo: 0.20, hi: 0.35 },
    notSure: { lo: 0, hi: 0.35 },
  };

  const api = { FIGURES, SE, INCOME_BANDS, US_PAY_BANDS, FOREIGN_TAX_BANDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FEIE_FIGURES = api;
})(typeof window !== 'undefined' ? window : globalThis);
