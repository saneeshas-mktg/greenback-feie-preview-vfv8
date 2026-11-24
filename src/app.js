/* FEIE calculator UI. Lives in the white card in the green hero, like the form card on the new service pages.
   One question at a time, an editable answer trail, then the result. No build step, no dependencies. */
(function () {
  const L = window.FEIE_LOGIC;
  const root = document.getElementById('feie-calculator');
  let answers = {};
  let history = []; // question ids in the order answered

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };
  const linkEl = l => el('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label);
  const optLabel = (id, v) => (L.BY_ID[id].options.find(o => o.value === v) || {}).label || v;
  const SHORT = { status: 'Status', year: 'Tax Year', where: 'Living', days: 'Days Abroad', fullYear: 'Full Year in One Country', payer: 'Paid By', filing: 'Filing Status', spouseAbroad: 'Spouse Earns Abroad', income: 'Income', moveMonth: 'Moved In', usPay: 'U.S. Pay Before Move', otherIncome: 'Other Income', otherAmount: 'Other Income Amount', children: 'Children Under 17', foreignTax: 'Foreign Tax' };

  function progress(q) {
    const total = 10;
    const n = Math.min(Number(q.number) || total, total);
    return el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(n) },
      el('div', { class: 'progress-label' }, q.followUp ? 'Question ' + q.number + ' · Follow-Up' : 'Question ' + q.number + ' of ' + total),
      el('div', { class: 'progress-track' }, el('div', { class: 'progress-fill', style: 'width:' + (n / total * 100) + '%' })));
  }

  /* Answer trail: every answer so far. Click a chip to change that answer. */
  function trail() {
    if (!history.length) return null;
    return el('div', { class: 'trail' },
      el('div', { class: 'trail-label' }, 'Your Answers'),
      el('div', { class: 'chips' }, history.map(id => el('button', {
        type: 'button', class: 'chip', title: 'Change this answer', onclick: () => jumpTo(id),
      }, el('span', { class: 'chip-k' }, SHORT[id] + ':'), ' ', optLabel(id, answers[id])))));
  }

  function renderQuestion(id) {
    const q = L.BY_ID[id];
    const moved = answers.where === 'moved';
    const title = (id === 'income' && moved && q.titleMoved) ? q.titleMoved : q.title;
    const helper = (id === 'income' && moved && q.helperMoved) ? q.helperMoved : q.helper;
    const showLinks = q.id === 'payer' ? [] : q.links; // the self-employment link only shows on the result
    const name = 'q-' + q.id;
    const options = el('div', { class: 'options' + (q.options.length > 6 ? ' options-grid' : ''), role: 'radiogroup', 'aria-labelledby': name + '-title' },
      q.options.map(o => el('button', {
        type: 'button', class: 'option' + (answers[q.id] === o.value ? ' selected' : ''), role: 'radio',
        'aria-checked': answers[q.id] === o.value ? 'true' : 'false',
        onclick: () => choose(q.id, o.value),
      }, o.label)));
    const card = el('div', { class: 'question' },
      progress(q),
      el('h2', { id: name + '-title', class: 'q-title', tabindex: '-1' }, title),
      el('div', { class: 'helper' },
        el('p', {}, helper),
        showLinks.length ? el('p', { class: 'helper-links' }, 'Learn More: ', ...showLinks.flatMap((k, i) => [i ? ' · ' : '', linkEl(L.LINKS[k])])) : null),
      options,
      history.length ? el('button', { type: 'button', class: 'back', onclick: back }, '← Back') : null,
      trail());
    root.replaceChildren(card);
    card.querySelector('.q-title').focus?.({ preventScroll: true });
  }

  function choose(id, value) {
    const idx = history.indexOf(id); // changing an answer clears everything after it
    if (idx >= 0) { for (const later of history.slice(idx + 1)) delete answers[later]; history = history.slice(0, idx); }
    answers[id] = value;
    history.push(id);
    step();
  }
  function jumpTo(id) {
    const idx = history.indexOf(id);
    for (const later of history.slice(idx)) delete answers[later];
    history = history.slice(0, idx);
    step();
  }
  function back() { const last = history.pop(); if (last) delete answers[last]; step(); }
  function restart() { answers = {}; history = []; step(); }

  function renderResult(outcome) {
    const r = L.buildResult(answers, outcome);
    const [lead, ...rest] = r.figures;
    const card = el('div', { class: 'result result-' + r.color },
      el('div', { class: 'result-head' }, el('span', { class: 'badge' }, r.letter), el('h2', {}, r.name)),
      lead ? el('div', { class: 'headline' }, el('div', { class: 'figure-label' }, lead.label), el('div', { class: 'headline-value' }, lead.value)) : null,
      rest.length ? el('div', { class: 'figures' }, rest.map(f => el('div', { class: 'figure' }, el('div', { class: 'figure-label' }, f.label), el('div', { class: 'figure-value' }, f.value)))) : null,
      r.lines.map(t => el('p', {}, t)),
      r.links.length ? el('p', { class: 'helper-links' }, 'Read More: ', ...r.links.flatMap((l, i) => [i ? ' · ' : '', linkEl(l)])) : null,
      el('div', { class: 'next-step' },
        el('div', { class: 'next-label' }, 'Your Next Step'),
        el('p', {}, r.nextStep),
        el('button', { type: 'button', class: 'btn btn-primary', onclick: openGetStarted }, 'Get Started')),
      el('div', { class: 'not-ready' },
        el('div', { class: 'next-label' }, 'Not Ready Yet?'),
        el('p', {}, 'Book a paid consultation with a CPA or Enrolled Agent, or a free support call with the Greenback team.'),
        el('div', { class: 'btn-row' }, linkBtn(L.LINKS.consultation), linkBtn(L.LINKS.supportCall))),
      ['C', 'D', 'E'].includes(r.letter) ? emailAsk() : null,
      el('p', { class: 'small' }, r.estimateLabel + ' ' + r.filingReminder),
      el('div', { class: 'result-foot' },
        el('button', { type: 'button', class: 'back', onclick: back }, '← Back'),
        el('button', { type: 'button', class: 'back', onclick: restart }, 'Start Over')),
      trail());
    root.replaceChildren(card);
    card.querySelector('h2').setAttribute('tabindex', '-1');
    card.querySelector('h2').focus?.({ preventScroll: true });
  }

  const linkBtn = l => el('a', { class: 'btn btn-outline', href: l.url, target: '_blank', rel: 'noopener' }, l.label);

  // Optional email ask, after the result. PROTOTYPE ONLY: nothing is sent or stored.
  function emailAsk() {
    const status = el('p', { class: 'small', 'aria-live': 'polite' });
    const input = el('input', { type: 'email', placeholder: 'you@example.com', 'aria-label': 'Email address' });
    return el('div', { class: 'email-ask' },
      el('div', { class: 'next-label' }, 'Optional'),
      el('p', {}, 'Want the expanded FEIE spreadsheet to work through your numbers in more detail? We’ll email it to you.'),
      el('div', { class: 'email-row' }, input, el('button', { type: 'button', class: 'btn btn-outline', onclick: () => { status.textContent = 'Prototype only: in the live build this sends the expanded FEIE spreadsheet. Nothing was sent.'; } }, 'Email Me the Spreadsheet')),
      status);
  }

  function openGetStarted() {
    const dlg = document.getElementById('get-started');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  function step() {
    const w = L.walk(answers);
    if (w.outcome) renderResult(w.outcome); else renderQuestion(w.current);
  }

  document.getElementById('get-started-close').addEventListener('click', () => document.getElementById('get-started').close());
  document.querySelectorAll('[data-get-started]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openGetStarted(); }));
  step();
})();
