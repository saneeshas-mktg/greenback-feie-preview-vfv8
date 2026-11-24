/* FEIE calculator UI: guided, full-width. One question per screen, an editable answer trail,
   a two-part progress rail, then a report-style result. No build step, no dependencies. */
(function () {
  const L = window.FEIE_LOGIC;
  const root = document.getElementById('feie-calculator');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let answers = {};
  let history = [];

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };
  const ext = l => el('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label);
  const optLabel = (id, v) => (L.BY_ID[id].options.find(o => o.value === v) || {}).label || v;
  const SHORT = { status: 'Status', year: 'Tax year', where: 'Living', days: 'Days abroad', fullYear: 'Full year in one country', payer: 'Paid by', filing: 'Filing', spouseAbroad: 'Spouse earns abroad', income: 'Income', moveMonth: 'Moved in', usPay: 'U.S. pay before move', otherIncome: 'Other income', otherAmount: 'Other income amount', children: 'Children under 17', foreignTax: 'Foreign tax' };

  /* Progress rail: 10 ticks in two phases */
  function rail(currentNumber, done) {
    const n = Number(currentNumber) || 10;
    const phase = (label, from, to) => el('div', { class: 'phase' + (n >= from || done ? ' on' : '') },
      el('div', { class: 'phase-label' }, label),
      el('div', { class: 'ticks' }, Array.from({ length: to - from + 1 }, (_, i) => {
        const k = from + i;
        return el('span', { class: 'tick' + (done || k < n ? ' done' : k === n ? ' now' : '') });
      })));
    return el('div', { class: 'rail', 'aria-hidden': 'true' }, phase('Do I qualify?', 1, 5), phase('What would I owe?', 6, 10));
  }

  /* Answer trail: every answer so far, click to change it */
  function trail() {
    if (!history.length) return null;
    return el('div', { class: 'trail' },
      el('span', { class: 'trail-label' }, 'Your answers'),
      el('div', { class: 'chips' }, history.map(id => el('button', {
        type: 'button', class: 'chip', title: 'Change this answer',
        onclick: () => jumpTo(id),
      }, el('span', { class: 'chip-k' }, SHORT[id] + ':'), ' ', optLabel(id, answers[id])))));
  }

  function jumpTo(id) {
    const idx = history.indexOf(id);
    for (const later of history.slice(idx)) delete answers[later];
    history = history.slice(0, idx);
    step();
  }

  function renderQuestion(id) {
    const q = L.BY_ID[id];
    const moved = answers.where === 'moved';
    const title = (id === 'income' && moved && q.titleMoved) ? q.titleMoved : q.title;
    const helper = (id === 'income' && moved && q.helperMoved) ? q.helperMoved : q.helper;
    const links = q.id === 'payer' ? [] : q.links;
    const many = q.options.length > 6;
    const stage = el('section', { class: 'stage', 'aria-labelledby': 'q-title' },
      rail(q.number, false),
      trail(),
      el('p', { class: 'q-kicker' }, q.followUp ? 'Question ' + q.number + ', one more detail' : 'Question ' + q.number + ' of 10'),
      el('h2', { id: 'q-title', class: 'q-title', tabindex: '-1' }, title),
      el('p', { class: 'q-helper' }, helper,
        links.length ? [' ', ...links.flatMap((k, i) => [i ? ' · ' : '', ext(L.LINKS[k])])] : null),
      el('div', { class: 'tiles' + (many ? ' tiles-dense' : ''), role: 'radiogroup', 'aria-labelledby': 'q-title' },
        q.options.map((o, i) => el('button', {
          type: 'button', role: 'radio', class: 'tile',
          'aria-checked': 'false', 'data-key': many ? null : String(i + 1),
          onclick: () => choose(q.id, o.value),
        }, many ? null : el('span', { class: 'tile-key', 'aria-hidden': 'true' }, String(i + 1)), el('span', { class: 'tile-text' }, o.label)))),
      el('div', { class: 'stage-foot' },
        history.length ? el('button', { type: 'button', class: 'link-btn', onclick: back }, '← Back') : el('span'),
        many ? el('span') : el('span', { class: 'hint' }, 'Tip: press 1 to ' + q.options.length + ' to answer')));
    swap(stage);
  }

  function choose(id, value) {
    answers[id] = value;
    history.push(id);
    step();
  }
  function back() { const last = history.pop(); if (last) delete answers[last]; step(); }
  function restart() { answers = {}; history = []; step(); }

  function renderResult(outcome) {
    const r = L.buildResult(answers, outcome);
    const head = r.figures[0];
    const rest = r.figures.slice(1);
    const report = el('section', { class: 'report report-' + r.color, 'aria-labelledby': 'r-title' },
      rail(10, true),
      el('p', { class: 'r-pill' }, el('span', { class: 'r-letter' }, r.letter), 'Result ' + r.letter),
      el('h2', { id: 'r-title', class: 'r-title', tabindex: '-1' }, r.name),
      el('div', { class: 'report-grid' },
        el('div', { class: 'report-main' },
          head ? el('div', { class: 'headline' },
            el('div', { class: 'headline-num' }, head.value),
            el('div', { class: 'headline-cap' }, head.label)) : null,
          rest.length ? el('ul', { class: 'subfigs' }, rest.map(f => el('li', {}, el('strong', {}, f.value), ' ', f.label.charAt(0).toLowerCase() + f.label.slice(1)))) : null,
          el('div', { class: 'r-copy' }, r.lines.map(t => el('p', {}, t))),
          r.links.length ? el('p', { class: 'r-links' }, 'Read more: ', ...r.links.flatMap((l, i) => [i ? ' · ' : '', ext(l)])) : null),
        el('aside', { class: 'next' },
          el('p', { class: 'next-label' }, 'Your next step'),
          el('p', { class: 'next-text' }, r.nextStep),
          el('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: openGetStarted }, 'Get Started'),
          el('p', { class: 'next-small' }, 'You\u2019ll have peace of mind, knowing that your taxes were done right.'))),
      el('div', { class: 'choices' },
        el('h3', { class: 'choices-title' }, 'Not ready yet?'),
        el('div', { class: 'choice-grid' },
          choiceCard('Paid consultation', 'with a CPA or Enrolled Agent', 'Expert guidance on your specific situation, or help with a decision that has several moving parts.', L.LINKS.consultation, 'btn-mint'),
          choiceCard('Introductory support call', 'with a member of the Greenback team', 'Questions before you start, or more about how Greenback works. Always free, no obligation.', L.LINKS.supportCall, 'btn-ghost'))),
      ['C', 'D', 'E'].includes(r.letter) ? emailAsk() : null,
      el('p', { class: 'fine' }, r.estimateLabel + ' ' + r.filingReminder),
      el('div', { class: 'report-foot' }, el('button', { type: 'button', class: 'link-btn', onclick: restart }, 'Start over'), trail()));
    swap(report);
  }

  function choiceCard(title, sub, body, link, btnClass) {
    return el('div', { class: 'choice' },
      el('h4', {}, title), el('p', { class: 'choice-sub' }, sub), el('p', {}, body),
      el('a', { class: 'btn ' + btnClass, href: link.url, target: '_blank', rel: 'noopener' }, link.label));
  }

  // Optional value-add email ask. PROTOTYPE ONLY: nothing is sent or stored.
  function emailAsk() {
    const status = el('p', { class: 'fine', 'aria-live': 'polite' });
    const input = el('input', { id: 'email-ask', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' });
    return el('form', { class: 'email-strip', onsubmit: e => { e.preventDefault(); status.textContent = 'Prototype only: in the live build this emails the expanded FEIE spreadsheet. Nothing was sent.'; } },
      el('div', {}, el('p', { class: 'email-title' }, 'Want to work through your numbers in more detail?'),
        el('p', { class: 'email-sub' }, 'Get the expanded FEIE spreadsheet by email. Optional.')),
      el('div', { class: 'email-row' }, el('label', { for: 'email-ask', class: 'sr' }, 'Email address'), input,
        el('button', { type: 'submit', class: 'btn btn-outline' }, 'Email me the spreadsheet')),
      status);
  }

  function swap(node) {
    root.replaceChildren(node);
    if (!reduceMotion) { node.classList.add('enter'); requestAnimationFrame(() => node.classList.remove('enter')); }
    const h = node.querySelector('h2');
    if (h && history.length) { h.focus({ preventScroll: true }); root.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }); }
  }

  function openGetStarted() {
    const d = document.getElementById('get-started');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  function step() {
    const w = L.walk(answers);
    if (w.outcome) renderResult(w.outcome); else renderQuestion(w.current);
  }

  // Number keys pick an option on short questions.
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const t = root.querySelector('.tile[data-key="' + e.key + '"]');
    if (t) t.click();
  });
  document.getElementById('get-started-close').addEventListener('click', () => document.getElementById('get-started').close());
  document.querySelectorAll('[data-get-started]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openGetStarted(); }));
  step();
})();
