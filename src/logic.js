/*
 * FEIE calculator logic: questions, routing, math and result copy.
 * Pure functions only (no DOM), so the same file runs in the browser and in the Node tests.
 */
(function (root) {
  const F = (typeof module !== 'undefined' && module.exports) ? require('./figures.js') : root.FEIE_FIGURES;
  const { FIGURES, SE, INCOME_BANDS, US_PAY_BANDS, FOREIGN_TAX_BANDS } = F;

  const G = 'https://www.greenbacktaxservices.com';
  const LINKS = {
    citizens: { label: 'Taxes for U.S. citizens living abroad', url: G + '/who-we-help/taxes-for-us-citizens-living-abroad/' },
    foreignNationals: { label: 'Tax Help for Visa and Green Card Holders', url: G + '/who-we-help/foreign-nationals/' },
    foreigners: { label: 'U.S. Taxes for Foreigners', url: G + '/knowledge-center/us-taxes-for-foreigners/' },
    deadlines: { label: 'U.S. tax deadlines for Americans abroad', url: G + '/knowledge-center/tax-deadlines-expats/' },
    lateFilers: { label: 'Late Filers', url: G + '/who-we-help/late-filers/' },
    streamlined: { label: 'Streamlined Filing Procedures', url: G + '/knowledge-center/everything-to-know-streamlined-filing/' },
    digitalNomads: { label: 'Digital Nomads', url: G + '/who-we-help/digital-nomads/' },
    digitalNomadTaxes: { label: 'Digital Nomad Taxes', url: G + '/knowledge-center/digital-nomad-taxes/' },
    fbar: { label: 'FBAR guide', url: G + '/knowledge-center/fbar/' },
    propertyAbroad: { label: 'Tax Help for Americans with Property Abroad', url: G + '/who-we-help/foreign-property-owners/' },
    movingAbroad: { label: 'Moving Abroad', url: G + '/who-we-help/moving-abroad/' },
    ppt: { label: 'Physical Presence Test', url: G + '/knowledge-center/physical-presence-test/' },
    bfr: { label: 'Bona Fide Residence Test', url: G + '/knowledge-center/bona-fide-residence-test/' },
    form2350: { label: 'Form 2350', url: G + '/knowledge-center/form-2350/' },
    seTax: { label: 'Do U.S. Expats Pay Self-Employment Tax?', url: G + '/knowledge-center/do-us-expats-pay-self-employment-tax/' },
    feieGuide: { label: 'FEIE guide', url: G + '/knowledge-center/tips-updates-foreign-earned-income-exclusion/' },
    foreignSpouse: { label: 'Filing with a foreign spouse', url: G + '/knowledge-center/filing-joint-taxes-foreign-spouse/' },
    rental: { label: 'Foreign Rental Income', url: G + '/knowledge-center/report-rental-income-foreign-property/' },
    retirees: { label: 'Tax Help for U.S. Retirees Living Abroad', url: G + '/who-we-help/retirees-abroad/' },
    ctc: { label: 'Child Tax Credit for Expats', url: G + '/knowledge-center/child-tax-credit-for-expats/' },
    feieVsFtc: { label: 'FEIE vs. FTC', url: G + '/knowledge-center/feie-vs-ftc/' },
    consultation: { label: 'Book a consultation', url: G + '/services/expat-tax-consultation/' },
    supportCall: { label: 'Book a support call', url: G + '/services/support-call/' },
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /*
   * QUESTIONS. Each has: id, title, helper, links (shown under the helper), options [{value,label}],
   * show(answers) (optional, default true) and next(answers) => next question id, or { result, reason }.
   * Order of the array is the order shown.
   */
  const QUESTIONS = [
    { id: 'status', number: '1', title: 'What is your U.S. tax status?',
      helper: 'U.S. citizens and green card holders file a U.S. tax return every year, wherever they live. The FEIE is how many of them keep the same income from being taxed twice.',
      links: ['citizens'],
      options: [{ value: 'citizen', label: 'U.S. citizen' }, { value: 'greenCard', label: 'Green card holder' }, { value: 'neither', label: 'Neither' }],
      next: a => a.status === 'neither' ? { result: 'A', reason: 'status' } : 'year' },
    { id: 'year', number: '2', title: 'Which tax year are you estimating?',
      helper: 'A tax year is the calendar year your income was earned. Income from January to December 2025 goes on the return you file in 2026.',
      links: ['deadlines'],
      options: [{ value: '2025', label: '2025 (filing now or on extension)' }, { value: '2026', label: '2026' }, { value: 'earlier', label: 'An earlier year I haven’t filed' }],
      next: a => a.year === 'earlier' ? { result: 'B', reason: 'late' } : 'where' },
    { id: 'where', number: '3', title: 'Where do you live right now?',
      helper: 'The FEIE only covers income from work you do while living outside the U.S. If you live in the U.S. and work remotely for a company abroad, it doesn’t apply.',
      links: [],
      options: [{ value: 'oneCountry', label: 'In one country outside the U.S.' }, { value: 'moved', label: 'I moved abroad this year' }, { value: 'fewCountries', label: 'I live in a few countries during the year' }, { value: 'noBase', label: 'I travel full time with no home base' }, { value: 'us', label: 'I still live in the U.S.' }],
      next: a => a.where === 'noBase' ? { result: 'B', reason: 'nomad' } : a.where === 'us' ? { result: 'A', reason: 'us' } : 'days' },
    { id: 'days', number: '4', title: 'In any 12 months in a row, how many full days were you outside the U.S.?',
      helper: 'A full day runs from midnight to midnight. The days don’t have to be in one country, and the 12 months don’t have to match the calendar year. If you moved recently and plan to stay, count the 12 months from your move.',
      links: ['ppt'],
      options: [{ value: '330plus', label: '330 or more' }, { value: '300to329', label: '300 to 329' }, { value: 'under300', label: 'Under 300' }, { value: 'notSure', label: 'Not sure yet' }],
      next: a => a.days === '330plus' ? 'payer' : 'fullYear' },
    { id: 'fullYear', number: '4', followUp: true, title: 'Have you lived in one country for a full calendar year?',
      helper: 'A full calendar year is January 1 to December 31. Short trips away are fine if you kept your home there.',
      links: ['bfr'],
      show: a => a.days && a.days !== '330plus',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
      next: a => a.fullYear === 'yes' ? 'payer' : { result: 'A', reason: 'days' } },
    { id: 'payer', number: '5', title: 'Who pays you?',
      helper: 'Where your employer is based doesn’t decide it. What counts is where you live and do the work. Pay from the U.S. government can’t be excluded.',
      links: ['seTax'], linksNote: 'Self-employed readers see this link:',
      options: [{ value: 'foreignCo', label: 'A foreign company' }, { value: 'usCo', label: 'A U.S. company' }, { value: 'self', label: 'I’m self-employed' }, { value: 'mixed', label: 'More than one' }, { value: 'gov', label: 'Only the U.S. government or military' }],
      next: a => a.payer === 'gov' ? { result: 'A', reason: 'gov' } : 'filing' },
    { id: 'filing', number: '6', title: 'What is your filing status?',
      helper: 'If your spouse isn’t a U.S. citizen or green card holder, you usually file as married filing separately, unless you choose to file jointly.',
      links: ['foreignSpouse'],
      options: [{ value: 'single', label: 'Single' }, { value: 'hoh', label: 'Head of household' }, { value: 'mfs', label: 'Married filing separately' }, { value: 'mfj', label: 'Married filing jointly' }],
      next: a => a.filing === 'mfj' ? 'spouseAbroad' : 'income' },
    { id: 'spouseAbroad', number: '6', followUp: true, title: 'Does your spouse also earn income abroad?',
      helper: 'Each spouse who works abroad can exclude their own income, up to the yearly limit each ($132,900 for 2026, $130,000 for 2025).',
      links: [],
      show: a => a.filing === 'mfj',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
      next: () => 'income' },
    { id: 'income', number: '7', title: 'About how much do you earn in a year?',
      helper: 'If you selected single, head of household or married filing separately, enter your own income. If you’re married filing jointly, enter both incomes together. Count pay and self-employment income before tax, in U.S. dollars.',
      titleMoved: 'About how much will you earn abroad this year?',
      helperMoved: 'Enter what you earn abroad this year. If you’re married filing jointly, include both incomes. Before tax, in U.S. dollars.',
      links: [],
      options: INCOME_BANDS.map(b => ({ value: b.id, label: b.label })),
      next: a => a.where === 'moved' ? 'moveMonth' : 'otherIncome' },
    { id: 'moveMonth', number: '7', followUp: true, title: 'Which month did you move abroad?',
      helper: 'Your FEIE limit is cut to the part of the year you lived abroad, so the month you moved changes the estimate.',
      links: ['movingAbroad'],
      show: a => a.where === 'moved',
      options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
      next: () => 'usPay' },
    { id: 'usPay', number: '7', followUp: true, title: 'About how much did you earn in the U.S. this year before moving?',
      helper: 'Pay for work done in the U.S. is fully taxed. Count it before tax.',
      links: [],
      show: a => a.where === 'moved',
      options: US_PAY_BANDS.map(b => ({ value: b.id, label: b.label })),
      next: () => 'otherIncome' },
    { id: 'otherIncome', number: '8', title: 'Do you have any other income?',
      helper: 'The FEIE only covers pay for work. Investment, rental and pension income are taxed separately.',
      links: [],
      options: [{ value: 'none', label: 'None' }, { value: 'investment', label: 'Investment' }, { value: 'rental', label: 'Rental' }, { value: 'pension', label: 'Pension' }, { value: 'multiple', label: 'More than one' }],
      next: a => a.otherIncome === 'none' ? 'children' : 'otherAmount' },
    { id: 'otherAmount', number: '8', followUp: true, title: 'About how much of that income do you get in a year?',
      helper: 'Small amounts can still be estimated. Larger amounts change how the FEIE and the Foreign Tax Credit work together, so an accountant looks at them with you.',
      links: [],
      show: a => a.otherIncome && a.otherIncome !== 'none',
      options: [{ value: 'under5k', label: 'Under $5,000' }, { value: '5kPlus', label: '$5,000 or more' }, { value: 'notSure', label: 'Not sure' }],
      next: a => a.otherAmount === 'under5k' ? 'children' : { result: 'B', reason: 'other' } },
    { id: 'children', number: '9', title: 'How many children under 17 live with you?',
      helper: 'Claiming the FEIE means you can’t get the refundable part of the child tax credit, so the Foreign Tax Credit is often the better fit for parents.',
      links: ['ctc'],
      options: [{ value: '0', label: 'None' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3 or more' }],
      next: a => {
        if (a.children !== '0') return { result: 'E', reason: 'children' };
        // Automatic check (never shown): below the no-tax line goes straight to C.
        return isBelowNoTaxLine(a) ? { result: 'C', reason: 'belowLine' } : 'foreignTax';
      } },
    { id: 'foreignTax', number: '10', title: 'About what share of your pay goes to income tax where you live?',
      helper: 'If you pay 10% or more in foreign income tax, the Foreign Tax Credit may lower your U.S. tax further.',
      links: ['feieVsFtc'],
      options: [{ value: 'under10', label: 'None or under 10%' }, { value: '10to20', label: '10% to 20%' }, { value: 'over20', label: 'Over 20%' }, { value: 'notSure', label: 'Not sure' }],
      next: a => a.foreignTax === 'under10' ? { result: 'D', reason: 'lowForeignTax' } : { result: 'E', reason: 'foreignTax' } },
  ];
  const BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

  /* ---------- Math ---------- */

  // Ordinary income tax on a taxable amount using the bracket table.
  function bracketTax(amount, brackets) {
    let tax = 0, lower = 0;
    for (const [upper, rate] of brackets) {
      if (amount <= lower) break;
      tax += (Math.min(amount, upper) - lower) * rate;
      lower = upper;
    }
    return tax;
  }

  // Share of the tax year the reader lived abroad, from the first day of the move month (movers only).
  function abroadShare(year, moveMonth) {
    if (!moveMonth) return 1;
    const y = Number(year);
    const start = Date.UTC(y, Number(moveMonth) - 1, 1), end = Date.UTC(y + 1, 0, 1);
    return Math.round((end - start) / 86400000) / FIGURES[y].daysInYear;
  }

  /*
   * Estimate for one exact set of numbers.
   * p = { year, filing, spouseAbroad, moveMonth, foreignIncome, usIncome, children, selfEmployed, foreignTaxRate }
   * Returns { excluded, taxable, feieTax, ctcUsed, feieTaxAfterCtc, ftcTax, seTax }.
   */
  function estimate(p) {
    const fig = FIGURES[p.year];
    const status = p.filing;
    const share = abroadShare(p.year, p.moveMonth);
    const limitEach = Math.round(fig.feieLimit * share);
    // Two earners: each spouse excludes their own pay. We assume the household income is split evenly.
    const twoEarners = status === 'mfj' && p.spouseAbroad === 'yes';
    const excluded = twoEarners ? 2 * Math.min(p.foreignIncome / 2, limitEach) : Math.min(p.foreignIncome, limitEach);
    const gross = p.foreignIncome + (p.usIncome || 0) + (p.otherIncome || 0); // other income is never excluded
    const taxable = Math.max(0, gross - excluded - fig.standardDeduction[status]);
    // Stacking rule (Form 2555 / Foreign Earned Income Tax Worksheet):
    // tax on (taxable income + excluded amount) minus tax on the excluded amount.
    const brackets = fig.brackets[status];
    const feieTax = taxable > 0 ? bracketTax(taxable + excluded, brackets) - bracketTax(excluded, brackets) : 0;
    const ctcMax = fig.childTaxCredit * (p.children || 0);
    const ctcUsed = Math.min(feieTax, ctcMax); // only the nonrefundable part: the FEIE blocks the refundable part
    const feieTaxAfterCtc = feieTax - ctcUsed;
    // Foreign Tax Credit on the foreign income above the exclusion (credit can't exceed the U.S. tax).
    const creditable = (p.foreignTaxRate || 0) * Math.max(0, p.foreignIncome - excluded);
    const ftcTax = Math.max(0, feieTaxAfterCtc - creditable);
    // Self-employment tax: not reduced by the FEIE. Ignores the half-SE-tax deduction and the 0.9% Additional Medicare Tax.
    let seTax = 0;
    if (p.selfEmployed) {
      const base = p.foreignIncome * SE.netEarningsFactor;
      seTax = Math.min(base, fig.ssWageBase) * SE.socialSecurityRate + base * SE.medicareRate;
    }
    return { excluded, taxable, feieTax, ctcUsed, feieTaxAfterCtc, ftcTax, seTax, limitEach };
  }

  const band = (list, id) => list.find(b => b.id === id);
  // Small other income (Q8 follow-up 'Under $5,000'): estimated across $0 to $5,000 and taxed in full.
  const OTHER_SMALL = { lo: 0, hi: 5000 };
  const round500 = n => Math.round(n / 500) * 500;

  function noTaxLine(a) {
    const fig = FIGURES[a.year];
    const limit = Math.round(fig.feieLimit * abroadShare(a.year, a.where === 'moved' ? a.moveMonth : null));
    const twoEarners = a.filing === 'mfj' && a.spouseAbroad === 'yes';
    return (twoEarners ? 2 * limit : limit) + fig.standardDeduction[a.filing];
  }

  // Automatic check before Q10: is the whole income band (plus U.S. pay for movers) at or below the no-tax line?
  function isBelowNoTaxLine(a) {
    const inc = band(INCOME_BANDS, a.income);
    const us = a.where === 'moved' ? band(US_PAY_BANDS, a.usPay).hi : 0;
    if (inc.openEnded) return false;
    if (a.otherAmount === 'under5k') return round500(estimate(Object.assign(paramsFor(a, inc.hi, us, 0), { otherIncome: OTHER_SMALL.hi })).feieTax) === 0;
    // Below the line means the estimate at the top of the band rounds to $0 (movers: U.S. pay is included, since it's fully taxed).
    return round500(estimate(paramsFor(a, inc.hi, us, 0)).feieTax) === 0;
  }

  function paramsFor(a, foreignIncome, usIncome, rate) {
    return {
      year: a.year, filing: a.filing, spouseAbroad: a.spouseAbroad,
      moveMonth: a.where === 'moved' ? a.moveMonth : null,
      foreignIncome, usIncome, children: Number(a.children || 0), otherIncome: 0,
      selfEmployed: a.payer === 'self', foreignTaxRate: rate,
    };
  }

  // Range across the income band, U.S. pay band (movers) and foreign-tax band, rounded to $500.
  function rangeFor(a) {
    const inc = band(INCOME_BANDS, a.income);
    const us = a.where === 'moved' ? band(US_PAY_BANDS, a.usPay) : { lo: 0, hi: 0 };
    const ft = a.foreignTax ? FOREIGN_TAX_BANDS[a.foreignTax] : null;
    const other = a.otherAmount === 'under5k' ? OTHER_SMALL : { lo: 0, hi: 0 };
    const lowP = Object.assign(paramsFor(a, inc.lo, us.lo, ft ? ft.hi : 0), { otherIncome: other.lo });
    const highP = Object.assign(paramsFor(a, inc.hi, us.hi, ft ? ft.lo : 0), { otherIncome: other.hi });
    const lo = estimate(lowP), hi = estimate(highP);
    return {
      openEnded: !!inc.openEnded,
      feie: [round500(lo.feieTaxAfterCtc), round500(hi.feieTaxAfterCtc)],
      ftc: ft ? [round500(lo.ftcTax), round500(hi.ftcTax)] : null,
      se: a.payer === 'self' ? [round500(lo.seTax), round500(hi.seTax)] : null,
      ctc: Number(a.children || 0) > 0 ? FIGURES[a.year].childTaxCredit * Number(a.children) : 0,
      line: noTaxLine(a),
    };
  }

  /* ---------- Routing ---------- */

  // Walk the answers from the start. Returns { path: [question ids asked], current: id | null, outcome: {result, reason} | null }
  function walk(answers) {
    const path = [];
    let id = 'status';
    while (id) {
      const q = BY_ID[id];
      path.push(id);
      if (answers[id] === undefined) return { path, current: id, outcome: null };
      const n = q.next(answers);
      if (typeof n === 'object') return { path, current: null, outcome: n };
      id = n;
    }
    return { path, current: null, outcome: null };
  }

  /* ---------- Result copy ---------- */

  const RESULT_META = {
    A: { name: 'May Not Apply Yet', color: 'grey' },
    B: { name: 'Get Started for a Personal Review', color: 'blue' },
    C: { name: 'Strong Fit: $0 U.S. Tax', color: 'green' },
    D: { name: 'Good Fit, Some U.S. Tax', color: 'yellow' },
    E: { name: 'Compare With the FTC', color: 'purple' },
  };

  const REASONS = {
    status: { text: 'The FEIE is for U.S. citizens and green card holders. If you live in the U.S. on a visa, or abroad as a non-U.S. citizen, different rules decide what you file.', links: ['foreignNationals', 'foreigners'] },
    us: { text: 'The FEIE only covers income from work you do while living outside the U.S., even when your employer is abroad. If you have accounts or property abroad, you may still have reporting to do.', links: ['fbar', 'propertyAbroad'] },
    days: { text: 'The FEIE can apply once you reach 330 full days abroad in 12 months, or a full calendar year living in one country. Form 2350 gives you extra time to file while you get there.', links: ['form2350', 'ppt'] },
    gov: { text: 'Pay from the U.S. government, including the military, can’t be excluded with the FEIE, even when you live abroad.', links: ['feieGuide'] },
    late: { text: 'Earlier years that haven’t been filed change how the FEIE is claimed. A Greenback accountant can look at every year together.', links: ['lateFilers', 'streamlined'] },
    nomad: { text: 'The FEIE needs a tax home abroad. Without a fixed base, whether you qualify depends on details an accountant should look at with you.', links: ['digitalNomads', 'digitalNomadTaxes'] },
    other: { text: 'Investment, rental and pension income aren’t covered by the FEIE, and they change how the FEIE and the Foreign Tax Credit work together. A Greenback accountant works it out with you.', links: ['rental', 'retirees'] },
  };

  const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
  // Refundable part of the child tax credit (Additional Child Tax Credit) per child, 2025 and 2026. FEIE filers can't claim it.
  const ACTC_PER_CHILD = 1700;

  function limitSentence(a) {
    const fig = FIGURES[a.year];
    if (a.where === 'moved') {
      const lim = Math.round(fig.feieLimit * abroadShare(a.year, a.moveMonth));
      return 'Because you moved this year, your FEIE limit is cut to about ' + fmt(lim) + ', the part of ' + fmt(fig.feieLimit) + ' for the months you lived abroad. U.S. pay before the move is taxed in full.';
    }
    if (a.filing === 'mfj' && a.spouseAbroad === 'yes') return 'The FEIE covers up to ' + fmt(fig.feieLimit) + ' of each spouse\u2019s pay.';
    return 'The FEIE covers up to ' + fmt(fig.feieLimit) + ' of your pay.';
  }
  const fmtRange = (r, open) => open ? 'at least ' + fmt(r[0]) : (r[0] === r[1] ? fmt(r[0]) : fmt(r[0]) + ' to ' + fmt(r[1]));

  function buildResult(answers, outcome) {
    const meta = RESULT_META[outcome.result];
    const out = { letter: outcome.result, name: meta.name, color: meta.color, reason: outcome.reason, lines: [], figures: [], links: [], nextStep: '' };
    const yearLabel = answers.year ? ' for ' + answers.year : '';
    if (REASONS[outcome.reason]) {
      out.lines.push(REASONS[outcome.reason].text);
      out.links = REASONS[outcome.reason].links.slice();
    }
    if (outcome.result === 'A') out.nextStep = {
      status: 'Get Started, so a Greenback accountant can tell you what you need to file.',
      us: 'Get Started, so a Greenback accountant can check what you need to report.',
      days: 'Get Started, so a Greenback accountant can plan your first return abroad.',
      gov: 'Get Started, so a Greenback accountant can look at what else you can claim.',
    }[outcome.reason];
    if (outcome.result === 'B') {
      out.lines.push({
        late: 'No number is shown, because each year is figured with its own IRS figures and rules.',
        nomad: 'No number is shown, because whether the FEIE applies depends on where your tax home is.',
        other: 'No number is shown, because that income changes the math for both the FEIE and the Foreign Tax Credit.',
      }[outcome.reason]);
      out.nextStep = 'Get Started, so an accountant can look at all of your income together.';
    }
    if (['C', 'D', 'E'].includes(outcome.result)) {
      const r = rangeFor(answers);
      if (outcome.result === 'C') {
        out.figures.push({ label: 'Estimated U.S. income tax' + yearLabel, value: '$0' });
        out.lines.push(answers.where === 'moved'
          ? 'With the FEIE covering your pay abroad, your income stays below the point where U.S. income tax starts. You still file a U.S. return to claim the FEIE.'
          : 'Your income is at or below the point where U.S. income tax starts for your filing status (about ' + fmt(r.line) + '). You still file a U.S. return to claim the FEIE.');
        out.nextStep = 'Get Started, so we file the return that claims the FEIE.';
      }
      if (outcome.result === 'D') {
        out.figures.push({ label: 'Estimated U.S. income tax with the FEIE' + yearLabel, value: fmtRange(r.feie, r.openEnded) });
        out.lines.push(limitSentence(answers) + ' Pay above the limit is taxed at the rate it would face if nothing were excluded.');
        out.nextStep = 'Get Started, so an accountant can confirm the figure and file your return.';
      }
      if (outcome.result === 'E') {
        out.figures.push({ label: 'Estimated U.S. income tax with the FEIE alone' + yearLabel, value: fmtRange(r.feie, r.openEnded) });
        if (outcome.reason === 'children') {
          const kids = Number(answers.children);
          out.lines.push(r.feie[1] === 0
            ? 'You’d owe $0 with the FEIE, but you’d give up the refundable part of the child tax credit (up to ' + fmt(ACTC_PER_CHILD * kids) + '). With the Foreign Tax Credit instead, many parents can claim it as a refund.'
            : 'This already takes off up to ' + fmt(r.ctc) + ' of child tax credit. With the FEIE you can’t get the refundable part of that credit, so the Foreign Tax Credit often works out better for parents.');
          out.links.push('ctc');
        } else {
          out.figures.push({ label: 'Once foreign tax is credited on the rest', value: r.openEnded ? (r.ftc[0] === r.ftc[1] ? fmt(r.ftc[0]) : 'from ' + fmt(r.ftc[0])) : fmtRange(r.ftc, false) });
          out.lines.push(answers.foreignTax === 'notSure'
            ? 'If you pay 10% or more in foreign income tax, the Foreign Tax Credit may cut your U.S. tax further, either on its own or alongside the FEIE.'
            : 'You pay enough foreign tax that the Foreign Tax Credit may cut your U.S. tax further, either on its own or alongside the FEIE.');
        }
        out.links.push('feieVsFtc');
        out.nextStep = 'Get Started, so a Greenback accountant compares the FEIE with the FTC for you.';
      }
      if (r.se) {
        out.figures.push({ label: 'Self-employment tax (not reduced by the FEIE)', value: fmtRange(r.se, r.openEnded) });
        out.lines.push('Self-employment tax still applies. A Social Security agreement with your country may remove it.');
        out.links.push('seTax');
      }
      if (answers.otherAmount === 'under5k') {
        const kind = { investment: 'investment', rental: 'rental', pension: 'pension', multiple: 'other' }[answers.otherIncome];
        out.lines.push('Your ' + kind + ' income (under $5,000) is included and taxed in full, because the FEIE only covers pay for work. Some investment income is taxed at lower rates, so the estimate may run a little high.');
        out.links.push(answers.otherIncome === 'pension' ? 'retirees' : 'rental');
      }
      if (answers.payer === 'mixed') {
        out.lines.push('If part of your pay is self-employment income, self-employment tax may also apply. The FEIE doesn\u2019t reduce it.');
        out.links.push('seTax');
      }
      if (answers.where === 'moved') out.links.push('movingAbroad');
    }
    out.links = [...new Set(out.links)].map(k => LINKS[k]);
    out.estimateLabel = 'Estimate only, based on ' + (answers.year || 'current') + ' IRS figures and your answers. It isn’t tax advice.';
    out.filingReminder = 'U.S. citizens and green card holders file a U.S. return every year, even when they owe $0.';
    return out;
  }

  const api = { QUESTIONS, BY_ID, LINKS, walk, buildResult, estimate, rangeFor, bracketTax, noTaxLine, isBelowNoTaxLine, abroadShare, fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FEIE_LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis);
