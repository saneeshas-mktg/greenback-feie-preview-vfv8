/* FEIE calculator UI. Renders one question at a time, then the result screen. No build step, no dependencies. */
(function () {
  const L = window.FEIE_LOGIC;
  const root = document.getElementById('feie-calculator');
  let answers = {};
  let history = []; // question ids in the order answered, for Back

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };
  const linkEl = l => el('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label);

  function progress(q) {
    const total = 10;
    const n = Math.min(Number(q.number) || total, total);
    return el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(n) },
      el('div', { class: 'progress-label' }, q.followUp ? 'Question ' + q.number + ' · follow-up' : 'Question ' + q.number + ' of ' + total),
      el('div', { class: 'progress-track' }, el('div', { class: 'progress-fill', style: 'width:' + (n / total * 100) + '%' })));
  }

  function renderQuestion(id) {
    const q = L.BY_ID[id];
    const helper = (id === 'income' && answers.where === 'moved' && q.helperMoved) ? q.helperMoved : q.helper;
    const showLinks = q.id === 'payer' ? [] : q.links; // SE link only appears on the result for self-employed readers
    const name = 'q-' + q.id;
    const options = el('div', { class: 'options' + (q.options.length > 6 ? ' options-grid' : ''), role: 'radiogroup', 'aria-labelledby': name + '-title' },
      q.options.map(o => el('button', {
        type: 'button', class: 'option' + (answers[q.id] === o.value ? ' selected' : ''), role: 'radio',
        'aria-checked': answers[q.id] === o.value ? 'true' : 'false',
        onclick: () => choose(q.id, o.value),
      }, o.label)));
    const card = el('div', { class: 'card question' },
      progress(q),
      el('h2', { id: name + '-title', class: 'q-title', tabindex: '-1' }, (id === 'income' && answers.where === 'moved' && q.titleMoved) ? q.titleMoved : q.title),
      el('div', { class: 'helper' },
        el('p', {}, helper),
        showLinks.length ? el('p', { class: 'helper-links' }, 'Learn more: ', ...showLinks.flatMap((k, i) => [i ? ' · ' : '', linkEl(L.LINKS[k])])) : null),
      options,
      history.length ? el('button', { type: 'button', class: 'back', onclick: back }, '← Back') : null);
    root.replaceChildren(card);
    card.querySelector('.q-title').focus?.();
  }

  function choose(id, value) {
    // Changing an answer clears everything after it.
    const idx = history.indexOf(id);
    if (idx >= 0) { for (const later of history.slice(idx + 1)) delete answers[later]; history = history.slice(0, idx); }
    answers[id] = value;
    history.push(id);
    step();
  }

  function back() {
    const last = history.pop();
    if (last) delete answers[last];
    step();
  }

  function restart() { answers = {}; history = []; step(); }

  function renderResult(outcome) {
    const r = L.buildResult(answers, outcome);
    const card = el('div', { class: 'card result result-' + r.color },
      el('div', { class: 'result-head' }, el('span', { class: 'badge' }, r.letter), el('h2', {}, r.name)),
      r.figures.length ? el('div', { class: 'figures' }, r.figures.map(f => el('div', { class: 'figure' }, el('div', { class: 'figure-label' }, f.label), el('div', { class: 'figure-value' }, f.value)))) : null,
      r.lines.map(t => el('p', {}, t)),
      r.links.length ? el('p', { class: 'helper-links' }, 'Read more: ', ...r.links.flatMap((l, i) => [i ? ' · ' : '', linkEl(l)])) : null,
      el('div', { class: 'next-step' }, el('div', { class: 'next-label' }, 'Next step'), el('p', {}, r.nextStep),
        el('button', { type: 'button', class: 'btn btn-primary', onclick: openGetStarted }, 'Get Started')),
      el('div', { class: 'not-ready' },
        el('div', { class: 'next-label' }, 'Not ready yet?'),
        el('p', {}, 'Book a paid consultation with a CPA or Enrolled Agent, or a free support call with the Greenback team.'),
        el('div', { class: 'btn-row' }, linkBtn(L.LINKS.consultation), linkBtn(L.LINKS.supportCall))),
      ['C', 'D', 'E'].includes(r.letter) ? emailAsk() : null,
      el('p', { class: 'small' }, r.estimateLabel + ' ' + r.filingReminder),
      el('button', { type: 'button', class: 'back', onclick: restart }, 'Start over'));
    root.replaceChildren(card);
  }

  const linkBtn = l => el('a', { class: 'btn btn-outline', href: l.url, target: '_blank', rel: 'noopener' }, l.label);

  // Optional value-add email ask. PROTOTYPE ONLY: nothing is sent or stored.
  function emailAsk() {
    const status = el('p', { class: 'small', 'aria-live': 'polite' });
    const input = el('input', { type: 'email', placeholder: 'you@example.com', 'aria-label': 'Email address' });
    return el('div', { class: 'email-ask' },
      el('div', { class: 'next-label' }, 'Optional'),
      el('p', {}, 'Want the expanded FEIE spreadsheet to work through your numbers in more detail? We’ll email it to you.'),
      el('div', { class: 'email-row' }, input, el('button', { type: 'button', class: 'btn btn-outline', onclick: () => { status.textContent = 'Prototype only: in the live build this sends the expanded FEIE spreadsheet. Nothing was sent.'; } }, 'Email me the spreadsheet')),
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
