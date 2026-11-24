// Prints the README "Questions" and "Results" sections from src/logic.js so the doc never drifts from the code.
const L = require('../src/logic.js');
const out = [];
const linkMd = k => `[${L.LINKS[k].label}](${L.LINKS[k].url})`;
const ROUTES = {
  status: 'U.S. citizen or green card holder → Q2. Neither → **Result A** (reason: status).',
  year: '2025 or 2026 → Q3, and the estimate uses that year\'s IRS figures. Earlier year → **Result B** (reason: late).',
  where: 'One country, moved this year, or a few countries → Q4 (movers also get the move-month and U.S.-pay follow-ups after Q7). No home base → **Result B** (reason: nomad). Still in the U.S. → **Result A** (reason: us).',
  days: '330 or more → Q5. Any other answer → follow-up "Have you lived in one country for a full calendar year?"',
  fullYear: 'Yes → Q5. No → **Result A** (reason: days).',
  payer: 'Any employer or self-employed → Q6. Only the U.S. government or military → **Result A** (reason: gov). Self-employed readers get a self-employment tax line and link on their result.',
  filing: 'Married filing jointly → follow-up "Does your spouse also earn income abroad?" Everyone else → Q7.',
  spouseAbroad: 'Either answer → Q7. "Yes" doubles the exclusion and the no-tax line.',
  moveMonth: 'Movers only. → U.S. pay before the move.',
  usPay: 'Movers only. → Q8.',
  income: 'Movers → move month follow-up. Everyone else → Q8.',
  otherIncome: 'None → Q9. Anything else → **Result B** (reason: other).',
  children: '1 or more → **Result E** (reason: children), no Q10. None → automatic check: at or below the no-tax line → **Result C**; above it → Q10.',
  foreignTax: 'None or under 10% → **Result D**. Anything else → **Result E** (reason: foreignTax).',
};
for (const q of L.QUESTIONS) {
  out.push(`### ${q.followUp ? 'Q' + q.number + ' follow-up' : 'Q' + q.number}: ${q.title}`);
  if (q.titleMoved) out.push(`*Title for movers: ${q.titleMoved}*`);
  if (q.show) out.push(`*Shown only when: ${{ fullYear: 'Q4 is not "330 or more"', spouseAbroad: 'Q6 is married filing jointly', moveMonth: 'Q3 is "I moved abroad this year"', usPay: 'Q3 is "I moved abroad this year"' }[q.id]}.*`);
  out.push('');
  out.push('**Answers:**');
  if (q.options.length > 8) out.push(q.options.map(o => o.label).join(' · '));
  else for (const o of q.options) out.push(`- ${o.label}`);
  out.push('');
  out.push(`**Helper text:** ${q.helper}`);
  if (q.helperMoved) out.push(`\n**Helper text for movers:** ${q.helperMoved}`);
  if (q.links.length) out.push(`\n**Link under the helper:** ${q.links.map(linkMd).join(', ')}${q.id === 'payer' ? ' (shown on the result for self-employed readers, not under the question)' : ''}`);
  out.push(`\n**Goes to:** ${ROUTES[q.id]}`);
  out.push('');
}
console.log(out.join('\n'));
