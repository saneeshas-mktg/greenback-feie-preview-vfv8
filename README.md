# FEIE Calculator: build requirements

**For:** Nahuel (development) · **From:** Saneesha Sahni, Marketing · **Reviewed with:** Hasalyn Modine
**Page:** `https://www.greenbacktaxservices.com/tools/feie-calculator/`
**Timeline:** kickoff Monday, Nov 30 · build in December · live early to mid January, before tax season opens at the end of January

This repo has two things:

1. **A working prototype** (`index.html` + `src/`). Open `index.html` in a browser and click through every path. The questions, branching, math and result copy are final. The styling follows the new service pages and Ariele's Support Call and Consultations designs: the calculator sits in the hero where the form card sits on those pages. Swap the prototype CSS for the site's own classes (`btn-primary`, `btn-orange`, the services-hub hero and stats blocks).
2. **This README**: everything the calculator has to do, written as text you can copy.

**You choose the build route.** Gravity Forms (which can handle conditional logic), a custom block, or reusing this JavaScript are all fine, as long as the requirements below are met. If something here is hard to build the way it's written, tell us and we'll adjust.

---

## 1. Must-haves

| # | Requirement | Why |
|---|---|---|
| 1 | **Embedded on the page**, not a pop-up. One question per screen, with a progress bar and a Back button. Changing an earlier answer clears the answers after it. | Readers answer one question at a time. |
| 2 | **The result shows on the page with no email gate.** | Google lists open calculators in AI Overviews. Gated tools don't get listed. |
| 3 | **Every question shows its helper text and link** (Section 3). | Readers know what each question means before they answer. |
| 4 | **No dead ends.** Readers the FEIE doesn't fit get the result and links in Section 5, never a bare "not eligible". | Every reader leaves with a next step. |
| 5 | **Every result has three actions:** **Get Started** (opens Greenback's existing Get Started pop-up form), **Book a consultation** (`/services/expat-tax-consultation/`, paid, with a CPA or Enrolled Agent) and **Book a support call** (`/services/support-call/`, free, with the Greenback team). | Get Started is the main conversion; the other two are for readers who aren't ready. |
| 6 | **Optional email ask on results C, D and E**: "Email me the spreadsheet" sends the **expanded FEIE spreadsheet** (the existing Excel calculator) to the email entered. It sits under the result, never before it. | The Excel sheet becomes a value-add for readers who want more detail. Marketing (Elizabeth) can confirm where the email goes. |
| 7 | **H1, quick answer and "How this estimate works" are plain HTML text** on the page, crawlable without running JavaScript. The H1 is the small eyebrow label "FEIE Calculator for U.S. Expats", as on the new service pages, with the large display line under it. | So Google can read and quote the page. The prototype shows the placement. |
| 8 | **All IRS figures live in one table** (`src/figures.js` in the prototype), keyed by tax year, not repeated inside form rules. | One place to update each November (Section 7). |
| 9 | **Answers are not stored or sent anywhere.** The calculator runs in the browser. Only the optional email ask submits anything. | Income answers are personal. |
| 10 | Works on mobile, keyboard-accessible, and the result is announced to screen readers (`aria-live`). | |
| 11 | Remove `noindex` from the live page (the prototype has it on purpose). | |

**Tracking (to confirm with marketing):** one GA4 event when a result shows (result letter A to E as a parameter), plus clicks on Get Started, the two booking buttons and the email ask.

---

## 2. How the flow works

Up to 10 questions. Questions 1 to 5 check whether the FEIE can apply at all. Questions 6 to 10 work out the estimate and whether the Foreign Tax Credit (FTC) may fit better. Follow-up questions only appear when an answer needs one. Every reader lands on one of five results:

| Result | Name | Who lands here |
|---|---|---|
| **A** | May Not Apply Yet | Not a U.S. citizen or green card holder, still in the U.S., not enough time abroad yet, or paid only by the U.S. government |
| **B** | Get Started for a Personal Review | An unfiled earlier year, no home base, or other income (investment, rental, pension). No number shown. |
| **C** | Strong Fit: $0 U.S. Tax | Income at or below the no-tax line for their filing status |
| **D** | Good Fit, Some U.S. Tax | Above the line, with under 10% of pay going to foreign tax |
| **E** | Compare With the FTC | Above the line with 10% or more foreign tax (or not sure), or anyone with children under 17 |

The **automatic check** after Q9 is not a question; the reader never sees it. It decides between result C and Q10 (Section 4).

---

## 3. Questions, helper text, links and routing

Copy exactly. Curly apostrophes are intentional.

### Q1: What is your U.S. tax status?

**Answers:**
- U.S. citizen
- Green card holder
- Neither

**Helper text:** U.S. citizens and green card holders file a U.S. tax return every year, wherever they live. The FEIE is how many of them keep the same income from being taxed twice.

**Link under the helper:** [Taxes for U.S. citizens living abroad](https://www.greenbacktaxservices.com/who-we-help/taxes-for-us-citizens-living-abroad/)

**Goes to:** U.S. citizen or green card holder → Q2. Neither → **Result A** (reason: status).

### Q2: Which tax year are you estimating?

**Answers:**
- 2025 (filing now or on extension)
- 2026
- An earlier year I haven’t filed

**Helper text:** A tax year is the calendar year your income was earned. Income from January to December 2025 goes on the return you file in 2026.

**Link under the helper:** [U.S. tax deadlines for Americans abroad](https://www.greenbacktaxservices.com/knowledge-center/tax-deadlines-expats/)

**Goes to:** 2025 or 2026 → Q3, and the estimate uses that year's IRS figures. Earlier year → **Result B** (reason: late).

### Q3: Where do you live right now?

**Answers:**
- In one country outside the U.S.
- I moved abroad this year
- I live in a few countries during the year
- I travel full time with no home base
- I still live in the U.S.

**Helper text:** The FEIE only covers income from work you do while living outside the U.S. If you live in the U.S. and work remotely for a company abroad, it doesn’t apply.

**Goes to:** One country, moved this year, or a few countries → Q4 (movers also get the move-month and U.S.-pay follow-ups after Q7). No home base → **Result B** (reason: nomad). Still in the U.S. → **Result A** (reason: us).

### Q4: In any 12 months in a row, how many full days were you outside the U.S.?

**Answers:**
- 330 or more
- 300 to 329
- Under 300
- Not sure yet

**Helper text:** A full day runs from midnight to midnight. The days don’t have to be in one country, and the 12 months don’t have to match the calendar year. If you moved recently and plan to stay, count the 12 months from your move.

**Link under the helper:** [Physical Presence Test](https://www.greenbacktaxservices.com/knowledge-center/physical-presence-test/)

**Goes to:** 330 or more → Q5. Any other answer → follow-up "Have you lived in one country for a full calendar year?"

### Q4 follow-up: Have you lived in one country for a full calendar year?
*Shown only when: Q4 is not "330 or more".*

**Answers:**
- Yes
- No

**Helper text:** A full calendar year is January 1 to December 31. Short trips away are fine if you kept your home there.

**Link under the helper:** [Bona Fide Residence Test](https://www.greenbacktaxservices.com/knowledge-center/bona-fide-residence-test/)

**Goes to:** Yes → Q5. No → **Result A** (reason: days).

### Q5: Who pays you?

**Answers:**
- A foreign company
- A U.S. company
- I’m self-employed
- More than one
- Only the U.S. government or military

**Helper text:** Where your employer is based doesn’t decide it. What counts is where you live and do the work. Pay from the U.S. government can’t be excluded.

**Link under the helper:** [Do U.S. Expats Pay Self-Employment Tax?](https://www.greenbacktaxservices.com/knowledge-center/do-us-expats-pay-self-employment-tax/) (shown on the result for self-employed readers, not under the question)

**Goes to:** Any employer or self-employed → Q6. Only the U.S. government or military → **Result A** (reason: gov). Self-employed readers get a self-employment tax line and link on their result.

### Q6: What is your filing status?

**Answers:**
- Single
- Head of household
- Married filing separately
- Married filing jointly

**Helper text:** If your spouse isn’t a U.S. citizen or green card holder, you usually file as married filing separately, unless you choose to file jointly.

**Link under the helper:** [Filing with a foreign spouse](https://www.greenbacktaxservices.com/knowledge-center/filing-joint-taxes-foreign-spouse/)

**Goes to:** Married filing jointly → follow-up "Does your spouse also earn income abroad?" Everyone else → Q7.

### Q6 follow-up: Does your spouse also earn income abroad?
*Shown only when: Q6 is married filing jointly.*

**Answers:**
- Yes
- No

**Helper text:** Each spouse who works abroad can exclude their own income, up to the yearly limit each ($132,900 for 2026, $130,000 for 2025).

**Goes to:** Either answer → Q7. "Yes" doubles the exclusion and the no-tax line.

### Q7: About how much do you earn in a year?
*Title for movers: About how much will you earn abroad this year?*

**Answers:**
Under $50,000 · $50,000 to $75,000 · $75,000 to $100,000 · $100,000 to $125,000 · $125,000 to $150,000 · $150,000 to $175,000 · $175,000 to $200,000 · $200,000 to $250,000 · $250,000 to $300,000 · Over $300,000

**Helper text:** If you selected single, head of household or married filing separately, enter your own income. If you’re married filing jointly, enter both incomes together. Count pay and self-employment income before tax, in U.S. dollars.

**Helper text for movers:** Enter what you earn abroad this year. If you’re married filing jointly, include both incomes. Before tax, in U.S. dollars.

**Goes to:** Movers → move month follow-up. Everyone else → Q8.

### Q7 follow-up: Which month did you move abroad?
*Shown only when: Q3 is "I moved abroad this year".*

**Answers:**
January · February · March · April · May · June · July · August · September · October · November · December

**Helper text:** Your FEIE limit is cut to the part of the year you lived abroad, so the month you moved changes the estimate.

**Link under the helper:** [Moving Abroad](https://www.greenbacktaxservices.com/who-we-help/moving-abroad/)

**Goes to:** Movers only. → U.S. pay before the move.

### Q7 follow-up: About how much did you earn in the U.S. this year before moving?
*Shown only when: Q3 is "I moved abroad this year".*

**Answers:**
None · Under $50,000 · $50,000 to $75,000 · $75,000 to $100,000 · $100,000 to $125,000 · $125,000 to $150,000 · $150,000 to $175,000 · $175,000 to $200,000 · $200,000 to $250,000 · $250,000 to $300,000 · Over $300,000

**Helper text:** Pay for work done in the U.S. is fully taxed. Count it before tax.

**Goes to:** Movers only. → Q8.

### Q8: Do you have any other income?

**Answers:**
- None
- Investment
- Rental
- Pension
- More than one

**Helper text:** The FEIE only covers pay for work. Investment, rental and pension income are taxed separately.

**Goes to:** None → Q9. Anything else → **Result B** (reason: other).

### Q9: How many children under 17 live with you?

**Answers:**
- None
- 1
- 2
- 3 or more

**Helper text:** Claiming the FEIE means you can’t get the refundable part of the child tax credit, so the Foreign Tax Credit is often the better fit for parents.

**Link under the helper:** [Child Tax Credit for Expats](https://www.greenbacktaxservices.com/knowledge-center/child-tax-credit-for-expats/)

**Goes to:** 1 or more → **Result E** (reason: children), no Q10. None → automatic check: at or below the no-tax line → **Result C**; above it → Q10.

### Q10: About what share of your pay goes to income tax where you live?

**Answers:**
- None or under 10%
- 10% to 20%
- Over 20%
- Not sure

**Helper text:** If you pay 10% or more in foreign income tax, the Foreign Tax Credit may lower your U.S. tax further.

**Link under the helper:** [FEIE vs. FTC](https://www.greenbacktaxservices.com/knowledge-center/feie-vs-ftc/)

**Goes to:** None or under 10% → **Result D**. Anything else → **Result E** (reason: foreignTax).

---

## 4. The math

All amounts come from `src/figures.js`, using the tax year picked in Q2.

**Step 1. Exclusion limit.**
- Limit per person = FEIE limit for the year ($130,000 for 2025, $132,900 for 2026).
- Movers: limit × (days from the 1st of the move month to Dec 31) ÷ 365.
- Married filing jointly and the spouse also earns abroad: each spouse gets their own limit. The prototype assumes the household income is split evenly, so the excluded amount = 2 × min(income ÷ 2, limit).

**Step 2. Excluded amount** = min(foreign income, limit). Movers' U.S. pay before the move is never excluded.

**Step 3. Taxable income** = max(0, foreign income + U.S. pay − excluded amount − standard deduction for the filing status).

**Step 4. U.S. income tax with the FEIE (IRS stacking rule).** If taxable income is 0, tax is $0. Otherwise:
`tax = bracketTax(taxable income + excluded amount) − bracketTax(excluded amount)`
using the ordinary bracket table for the filing status. Income above the exclusion is taxed at the rate it would face if nothing were excluded. (This is the Foreign Earned Income Tax Worksheet in the Form 1040 instructions.)

**Step 5. Child tax credit.** Subtract up to $2,200 per child, but never below $0. Only the nonrefundable part applies, because anyone claiming the FEIE can't get the refundable part (up to $1,700 per child for 2025 and 2026).

**Step 6. With the Foreign Tax Credit (result E only, when Q10 was answered).**
`tax after credit = max(0, tax from Step 5 − foreign tax rate × (foreign income − excluded amount))`
Foreign tax rate bands from Q10: under 10% = 0 to 10%, 10% to 20% = 10 to 20%, over 20% = 20 to 35%, not sure = 0 to 35%.

**Step 7. Self-employment tax (self-employed readers only).** Not reduced by the FEIE.
`net = foreign income × 92.35%` then `12.4% × min(net, Social Security wage base) + 2.9% × net`. Wage base: $176,100 (2025), $184,500 (2026). This leaves out the 0.9% Additional Medicare Tax and the deduction for half of self-employment tax; it's an estimate.

**Step 8. The range.** Run Steps 1 to 7 at the bottom and the top of the reader's income band (and U.S. pay band, and foreign tax band). The low end uses the lowest income and the highest foreign tax rate; the high end uses the highest income and the lowest rate. Round each end to the nearest $500. If both ends match, show one figure. "Over $300,000" is calculated at $300,000 and shown as "at least $X".

**Automatic check (between Q9 and Q10).** Run Step 4 at the top of the income band (plus movers' U.S. pay). If it rounds to $0, the reader goes to **result C**. Otherwise they answer Q10. The no-tax line this produces:

| Filing status | 2025 | 2026 |
|---|---|---|
| Single or married filing separately | $145,750 | $149,000 |
| Head of household | $153,625 | $157,050 |
| Married filing jointly, one earner abroad | $161,500 | $165,100 |
| Married filing jointly, both earning abroad | $291,500 | $298,000 |

Movers' line uses their reduced limit.

**Check figure:** single, $175,000, 2026, 330 days, living in Spain → $6,240 with the FEIE alone, $0 once Spanish tax is credited. (Taxable $26,000; tax on $158,900 = $30,734, minus tax on $132,900 = $24,494.)

---

## 5. Results: copy

Every result shows: the letter and name, the figures (C, D, E), the explanation, "Read more" links, **Next step** with the Get Started button, the not-ready block with both booking buttons, the optional email ask (C, D, E only), and small print.

Not-ready block (all results), label "Not ready yet?":
> Book a paid consultation with a CPA or Enrolled Agent, or a free support call with the Greenback team. [Book a consultation] [Book a support call]

Optional email ask (C, D, E), label "Optional":
> Want the expanded FEIE spreadsheet to work through your numbers in more detail? We’ll email it to you. [Email me the spreadsheet]

Small print:
- C, D, E: "Estimate only, based on [YEAR] IRS figures and your answers. It isn’t tax advice. U.S. citizens and green card holders file a U.S. return every year, even when they owe $0."
- A, B: "This isn’t tax advice. U.S. citizens and green card holders file a U.S. return every year, even when they owe $0."

### Result A: May Not Apply Yet

| Reason | Explanation | Read more links | Next step |
|---|---|---|---|
| Not a citizen or green card holder (Q1) | The FEIE is for U.S. citizens and green card holders. If you live in the U.S. on a visa, or abroad as a non-U.S. citizen, different rules decide what you file. | [Tax Help for Visa and Green Card Holders](https://www.greenbacktaxservices.com/who-we-help/foreign-nationals/), [U.S. Taxes for Foreigners](https://www.greenbacktaxservices.com/knowledge-center/us-taxes-for-foreigners/) | Get Started, so a Greenback accountant can tell you what you need to file. |
| Still in the U.S. (Q3) | The FEIE only covers income from work you do while living outside the U.S., even when your employer is abroad. If you have accounts or property abroad, you may still have reporting to do. | [FBAR guide](https://www.greenbacktaxservices.com/knowledge-center/fbar/), [Tax Help for Americans with Property Abroad](https://www.greenbacktaxservices.com/who-we-help/foreign-property-owners/) | Get Started, so a Greenback accountant can check what you need to report. |
| Not enough time abroad (Q4) | The FEIE can apply once you reach 330 full days abroad in 12 months, or a full calendar year living in one country. Form 2350 gives you extra time to file while you get there. | [Form 2350](https://www.greenbacktaxservices.com/knowledge-center/form-2350/), [Physical Presence Test](https://www.greenbacktaxservices.com/knowledge-center/physical-presence-test/) | Get Started, so a Greenback accountant can plan your first return abroad. |
| U.S. government pay (Q5) | Pay from the U.S. government, including the military, can’t be excluded with the FEIE, even when you live abroad. | [FEIE guide](https://www.greenbacktaxservices.com/knowledge-center/tips-updates-foreign-earned-income-exclusion/) | Get Started, so a Greenback accountant can look at what else you can claim. |

### Result B: Get Started for a Personal Review
No number. Next step on every B: "Get Started, so an accountant can look at all of your income together."

| Reason | Explanation (two lines) | Read more links |
|---|---|---|
| Earlier unfiled year (Q2) | Earlier years that haven’t been filed change how the FEIE is claimed. A Greenback accountant can look at every year together. / No number is shown, because each year is figured with its own IRS figures and rules. | [Late Filers](https://www.greenbacktaxservices.com/who-we-help/late-filers/), [Streamlined Filing Procedures](https://www.greenbacktaxservices.com/knowledge-center/everything-to-know-streamlined-filing/) |
| No home base (Q3) | The FEIE needs a tax home abroad. Without a fixed base, whether you qualify depends on details an accountant should look at with you. / No number is shown, because whether the FEIE applies depends on where your tax home is. | [Digital Nomads](https://www.greenbacktaxservices.com/who-we-help/digital-nomads/), [Digital Nomad Taxes](https://www.greenbacktaxservices.com/knowledge-center/digital-nomad-taxes/) |
| Other income (Q8) | Investment, rental and pension income aren’t covered by the FEIE, and they change how the FEIE and the Foreign Tax Credit work together. A Greenback accountant works it out with you. / No number is shown, because that income changes the math for both the FEIE and the Foreign Tax Credit. | [Foreign Rental Income](https://www.greenbacktaxservices.com/knowledge-center/report-rental-income-foreign-property/), [Tax Help for U.S. Retirees Living Abroad](https://www.greenbacktaxservices.com/who-we-help/retirees-abroad/) |

### Result C: Strong Fit: $0 U.S. Tax
Figure: "Estimated U.S. income tax for [YEAR]: $0"
Text: "Your income is at or below the point where U.S. income tax starts for your filing status (about $[LINE]). You still file a U.S. return to claim the FEIE."
Movers: "With the FEIE covering your pay abroad, your income stays below the point where U.S. income tax starts. You still file a U.S. return to claim the FEIE."
Next step: "Get Started, so we file the return that claims the FEIE."

### Result D: Good Fit, Some U.S. Tax
Figure: "Estimated U.S. income tax with the FEIE for [YEAR]: $[LOW] to $[HIGH]"
Text, first sentence by situation, then "Pay above the limit is taxed at the rate it would face if nothing were excluded.":
- Default: "The FEIE covers up to $[LIMIT] of your pay."
- Married jointly, both earning abroad: "The FEIE covers up to $[LIMIT] of each spouse’s pay."
- Movers: "Because you moved this year, your FEIE limit is cut to about $[REDUCED], the part of $[LIMIT] for the months you lived abroad. U.S. pay before the move is taxed in full."
Next step: "Get Started, so an accountant can confirm the figure and file your return."

### Result E: Compare With the FTC
Figure 1: "Estimated U.S. income tax with the FEIE alone for [YEAR]: $[LOW] to $[HIGH]"
- **Reached from Q10:** Figure 2: "Once foreign tax is credited on the rest: $[LOW] to $[HIGH]". Text: "You pay enough foreign tax that the Foreign Tax Credit may cut your U.S. tax further, either on its own or alongside the FEIE." If Q10 was "Not sure": "If you pay 10% or more in foreign income tax, the Foreign Tax Credit may cut your U.S. tax further, either on its own or alongside the FEIE."
- **Reached from Q9 (children), no second figure:**
  - If the FEIE estimate is above $0: "This already takes off up to $[CTC] of child tax credit. With the FEIE you can’t get the refundable part of that credit, so the Foreign Tax Credit often works out better for parents."
  - If the FEIE estimate is $0: "You’d owe $0 with the FEIE, but you’d give up the refundable part of the child tax credit (up to $[1,700 × children]). With the Foreign Tax Credit instead, many parents can claim it as a refund."
  - Extra link: [Child Tax Credit for Expats](https://www.greenbacktaxservices.com/knowledge-center/child-tax-credit-for-expats/)

Link on every E: [FEIE vs. FTC](https://www.greenbacktaxservices.com/knowledge-center/feie-vs-ftc/)
Next step: "Get Started, so a Greenback accountant compares the FEIE with the FTC for you."

### Extra lines that can appear on C, D or E
- **Self-employed (Q5):** figure "Self-employment tax (not reduced by the FEIE): $[LOW] to $[HIGH]", text "Self-employment tax still applies. A Social Security agreement with your country may remove it.", link [Do U.S. Expats Pay Self-Employment Tax?](https://www.greenbacktaxservices.com/knowledge-center/do-us-expats-pay-self-employment-tax/)
- **More than one payer (Q5):** text "If part of your pay is self-employment income, self-employment tax may also apply. The FEIE doesn’t reduce it." and the same link. No figure.
- **Movers (Q3):** link [Moving Abroad](https://www.greenbacktaxservices.com/who-we-help/moving-abroad/)

---

## 6. Test scenarios

Run `node tests/scenarios.test.js` to check the prototype logic. Use the same answers on the live build; each must land on the same result and figures.

`base` = U.S. citizen, 2026, one country abroad, 330+ days, foreign employer, single, $175k to $200k, no other income, no children.

| # | Reader | Key answers | Result | Figures |
|---|---|---|---|---|
| 1 | Not a U.S. citizen or green card holder | `status: neither` | A | no figure |
| 2 | Late filer, earlier year | `status: citizen, year: earlier` | B | no figure |
| 3 | Digital nomad with no home base | `base + where: noBase` | B | no figure |
| 4 | Still living in the U.S. | `base + where: us` | A | no figure |
| 5 | Under 330 days, no full calendar year | `base + days: 300to329, fullYear: no` | A | no figure |
| 6 | Under 330 days but a full calendar year (bona fide residence) | `base + days: under300, fullYear: yes, foreignTax: 10to20` | E | Estimated U.S. income tax with the FEIE alone for 2026: $6,000 to $12,000 ; Once foreign tax is credited on the rest: $0 to $5,500 |
| 7 | Paid only by the U.S. government | `base + payer: gov` | A | no figure |
| 8 | Has rental income | `base + otherIncome: rental` | B | no figure |
| 9 | Single, $50k to $75k, 2026: below the no-tax line | `base + income: b2` | C | no figure |
| 10 | Single, $125k to $150k, 2026: top of band is $1,000 over the line, estimate rounds to $0, so C | `base + income: b5` | C | Estimated U.S. income tax for 2026: $0 |
| 11 | Single, $150k to $175k, 2026: above the line, Q10 asked | `base + income: b6, foreignTax: under10` | D | Estimated U.S. income tax with the FEIE for 2026: $0 to $6,000 |
| 12 | Single, $175k to $200k, 2026, low foreign tax (e.g. UAE) | `base + foreignTax: under10` | D | Estimated U.S. income tax with the FEIE for 2026: $6,000 to $12,000 |
| 13 | Single, $175k to $200k, 2026, over 20% foreign tax (e.g. Spain) | `base + foreignTax: over20` | E | Estimated U.S. income tax with the FEIE alone for 2026: $6,000 to $12,000 ; Once foreign tax is credited on the rest: $0 |
| 14 | Married jointly, both work abroad, $250k to $300k, 2026: band top is above the $298,000 line | `base + filing: mfj, spouseAbroad: yes, income: b9, foreignTax: under10` | D | Estimated U.S. income tax with the FEIE for 2026: $0 to $500 |
| 15 | Married jointly, both work abroad, $200k to $250k, 2026: below the $298,000 line | `base + filing: mfj, spouseAbroad: yes, income: b8` | C | Estimated U.S. income tax for 2026: $0 |
| 16 | Married jointly, one earner, $175k to $200k, 2026 | `base + filing: mfj, spouseAbroad: no, foreignTax: 10to20` | E | Estimated U.S. income tax with the FEIE alone for 2026: $2,000 to $7,500 ; Once foreign tax is credited on the rest: $0 to $1,000 |
| 17 | Parent with 2 children goes to E without Q10 | `base + children: 2` | E | Estimated U.S. income tax with the FEIE alone for 2026: $2,000 to $8,000 |
| 18 | Self-employed in Thailand, $75k to $100k, 2026: $0 income tax but SE tax shown | `base + payer: self, income: b3` | C | Estimated U.S. income tax for 2026: $0 ; Self-employment tax (not reduced by the FEIE): $10,500 to $14,000 |
| 19 | Moved abroad in July 2026, $50k U.S. pay before the move, $75k to $100k abroad | `base + where: moved, moveMonth: 7, usPay: u2, income: b3, foreignTax: under10` | D | Estimated U.S. income tax with the FEIE for 2026: $9,500 to $21,500 |
| 20 | 2025 tax year, single, $150k to $175k, uses $130,000 limit | `base + year: 2025, income: b6, foreignTax: under10` | D | Estimated U.S. income tax with the FEIE for 2025: $1,000 to $7,000 |
| 21 | Over $300,000 shows an open-ended figure | `base + income: b10, foreignTax: notSure` | E | Estimated U.S. income tax with the FEIE alone for 2026: at least $43,500 ; Once foreign tax is credited on the rest: from $0 |
| 22 | Check figure: single, $175,000 exactly, 2026, Spain | exact inputs | n/a | $6,240 with the FEIE alone; $0 once Spanish tax is credited |

---

## 7. Every November: update the figures

When the IRS publishes next year's inflation adjustments (usually October or November, as a Revenue Procedure):

1. Add the new year to `figures.js`: FEIE limit, standard deductions, bracket tables for all four filing statuses, child tax credit, Social Security wage base (from SSA).
2. Add the new year to Q2 and drop the oldest one.
3. Update the figures table in "How this estimate works" and the quick answer.
4. Rerun the test scenarios and update the expected figures.
5. A Greenback EA or CPA checks the figures and the result wording before the update goes live.

**Sources used for 2025 and 2026 (checked Nov 24, 2026):** [IRS, Figuring the FEIE](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion) · [IRS, 2025 tax brackets](https://www.irs.gov/filing/federal-income-tax-rates-and-brackets) · [Rev. Proc. 2025-32 (2026 figures)](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf) · [IRS, standard deduction 2025 and 2026](https://www.irs.gov/newsroom/working-families-tax-cuts-individuals-and-workers) · [IRS, Child Tax Credit](https://www.irs.gov/credits-deductions/individuals/child-tax-credit) · [SSA, wage base](https://www.ssa.gov/oact/cola/cbb.html)

---

## 8. Files

| File | What it is |
|---|---|
| `index.html` | Prototype page: H1, quick answer, calculator, "How this estimate works", disclaimer |
| `src/figures.js` | All IRS figures by year, and the answer bands |
| `src/logic.js` | Questions, routing, math and result copy (no DOM; runs in Node too) |
| `src/app.js` | The on-page UI |
| `src/styles.css` | Greenback design tokens from the live service and Who We Help pages |
| `assets/greenback-logo.jpg` | Logo for the prototype header |
| `tests/scenarios.test.js` | Test scenarios (`node tests/scenarios.test.js`) |
| `tests/build-readme-sections.js` | Regenerates Section 3 of this README from `logic.js` |

**Next calculators on the same base:** FEIE vs. FTC (second prototype), then a 330-day counter in Q1, under `/tools/`.
