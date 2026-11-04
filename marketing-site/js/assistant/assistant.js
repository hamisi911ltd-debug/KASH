/* =========================================================
   KASH - js/assistant/assistant.js
   The chat assistant (robot button, bottom right).

   It is a GUIDED assistant: it understands keywords, answers, takes
   people to the right page, and hands heavy requests to customer
   service. Wording and keywords: js/assistant/assistant-data.js
   Optional real AI: set assistant.endpoint in js/config.js.
========================================================= */
'use strict';

const Assistant = (function () {
  const CONF = (window.KASH_CONFIG && window.KASH_CONFIG.assistant) || {};
  const STORE_KEY = 'kash-chat';
  const SEEN_KEY = 'kash-chat-seen';
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NAV_WORDS = /\b(take me|go to|show me|bring me|navigate|visit)\b|\bopen (the|a|my|up)\b/i;   /* "take me to the fleet" goes there straight away */

  const ROBOT = `<svg viewBox="0 0 48 48" aria-hidden="true"><line x1="24" y1="6" x2="24" y2="13" stroke="#ffb51a" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="5" r="3" fill="#ffb51a"/>
    <rect x="3" y="21" width="5" height="9" rx="2.5" fill="#ffb51a"/><rect x="40" y="21" width="5" height="9" rx="2.5" fill="#ffb51a"/>
    <rect x="8" y="13" width="32" height="25" rx="10" fill="#fff"/><rect x="12" y="17.5" width="24" height="16" rx="7" fill="#0a1f3d"/>
    <circle cx="19" cy="25" r="2.8" fill="#2fd3c1"/><circle cx="29" cy="25" r="2.8" fill="#2fd3c1"/>
    <path d="M20.5 29.6c2 1.7 5 1.7 7 0" fill="none" stroke="#2fd3c1" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  let host, panel, logEl, chipsEl, inputEl, launcher, bubble;
  let msgs = [], chips = [], queue = [], missed = 0, busy = false, isOpen = false, typingOn = false, nextId = 1;

  /* ---------- keyword matching ---------- */
  const compile = (words) => words.map((w) => {
    const stem = w.slice(-1) === '*';
    const base = w.replace(/\*$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp('\\b' + base + (stem ? '\\w*' : '\\b'), 'i');
  });
  const intents = ASSISTANT.intents.map((i) => Object.assign({}, i, {rx: compile(i.words)}));
  const heavyRx = compile(ASSISTANT.handoff.words);
  const safetyRx = compile(ASSISTANT.handoff.safetyWords);
  const normalise = (t) => t.toLowerCase().replace(/tuk[\s-]?tuk/g, 'tuktuk');
  const score = (rx, text) => rx.reduce((n, r) => n + (r.test(text) ? 1 : 0), 0);

  function pickIntent(text){
    let best = null, top = 0;
    intents.forEach((i) => { const s = score(i.rx, text); if (s > top){ top = s; best = i; } });
    return best;
  }
  const isHeavy = (raw, text) => raw.length > ASSISTANT.handoff.longMessage || heavyRx.some((r) => r.test(text));

  /* ---------- small helpers ---------- */
  const tokens = () => ({hours:B.hours, phone:B.phoneDisplay, email:B.email, location:B.location});
  const fill = (t) => t.replace(/\{(\w+)\}/g, (m, k) => (tokens()[k] != null ? tokens()[k] : m));
  const toHtml = (t) => esc(t).replace(/\n/g, '<br>');
  const stripHtml = (h) => h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCE ? Math.min(ms, 200) : ms));
  const isMobile = () => window.innerWidth <= 560;

  function save(){
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({msgs:msgs.slice(-40), chips, missed, nextId})); } catch (e) {}
  }
  function restore(){
    try {
      const d = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (d){ msgs = d.msgs || []; chips = d.chips || []; missed = d.missed || 0; nextId = d.nextId || 1; }
    } catch (e) {}
  }

  /* ---------- messages ---------- */
  function actionsHtml(actions){
    if (!actions || !actions.length) return '';
    return '<div class="chat-acts">' + actions.map((a) => a.href
      ? `<a class="chat-act" href="${esc(a.href)}">${a.icon ? ICONS[a.icon] || '' : ''}${esc(a.label)}</a>`
      : `<button class="chat-act" type="button" data-scroll="${esc(a.scroll)}">${esc(a.label)}</button>`).join('') + '</div>';
  }
  function push(from, html, extra){
    const m = Object.assign({id:nextId++, from, html}, extra || {});
    msgs.push(m); render(); save();
    return m;
  }
  function patch(id, changes){
    const m = msgs.find((x) => x.id === id);
    if (m){ Object.assign(m, changes); render(); save(); }
  }
  function setChips(list){ chips = list || []; renderChips(); save(); }

  function render(){
    if (!logEl) return;
    logEl.innerHTML = msgs.map((m) => `<div class="chat-msg ${m.from} ${m.cls || ''}">${m.html}</div>`).join('') +
      (typingOn ? '<div class="chat-msg bot typing" aria-label="The assistant is typing"><i></i><i></i><i></i></div>' : '');
    logEl.scrollTop = logEl.scrollHeight;
    requestAnimationFrame(() => { logEl.scrollTop = logEl.scrollHeight; });   /* again once the new message has its final height */
  }
  function renderChips(){
    if (!chipsEl) return;
    chipsEl.innerHTML = chips.map((c) => `<button type="button" class="chat-chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('');
  }

  /* The assistant "types" for a moment, then speaks. */
  async function botSay(text, o){
    o = o || {};
    typingOn = true; render();
    await wait(o.delay == null ? 650 : o.delay);
    typingOn = false;
    const m = push('bot', o.raw ? text : toHtml(fill(text)) + actionsHtml(o.actions), {cls:o.cls});
    if (o.chips) setChips(o.chips);
    return m;
  }

  /* ---------- the conversation ---------- */
  function welcome(){
    const r = route(), G = ASSISTANT.greetings;
    let text = G[r.name] || G.other;
    if (r.name === 'property'){
      const p = PROPERTIES.find((x) => x.id === r.param);
      text = text.replace('{name}', p ? p.name : 'this home');
    }
    return {text, chips:ASSISTANT.pageChips[r.name] || ASSISTANT.startChips};
  }
  function startConversation(){
    msgs = []; missed = 0;
    const w = welcome();
    push('bot', toHtml(w.text));
    setChips(w.chips);
  }

  async function answer(intent, raw){
    const r = route();
    let actions = intent.actions || [];
    if (intent.id === 'where' && r.name === 'property') actions = [{label:'Show the map', scroll:'propMap'}];
    if (intent.id === 'availability' && r.name === 'property') actions = [{label:'Go to the booking box', scroll:'d_in'}];
    await botSay(intent.reply, {actions, chips:intent.chips || ASSISTANT.startChips});
    const go = actions.find((a) => a.href);
    if (go && NAV_WORDS.test(raw)){
      await wait(900);
      location.hash = go.href;
      if (isMobile()) setOpen(false);
    }
  }

  async function askAI(raw){
    try {
      const res = await fetch(CONF.endpoint, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:raw, page:route().name, history:msgs.slice(-10).map((m) => ({from:m.from, text:stripHtml(m.html)}))})
      });
      if (!res.ok) throw new Error('AI endpoint ' + res.status);
      return await res.json();
    } catch (err) { console.error(err); return null; }
  }

  async function handleUser(raw){
    raw = raw.trim();
    if (!raw) return;
    if (busy){ queue.push(raw); return; }       /* typed while the assistant is replying: answer it next */
    busy = true;
    push('user', toHtml(raw));
    setChips([]);
    const text = normalise(raw);
    try {
      if (isHeavy(raw, text)){ await startHandoff(raw, text); }
      else {
        const intent = pickIntent(text), rate = rateLookup(text);
        if (rate){ missed = 0; await botSay(rate.reply, {actions:rate.actions, chips:['Request a truck', 'Talk to a person']}); }
        else if (intent){ missed = 0; await answer(intent, raw); }
        else {
          const ai = CONF.endpoint ? await askAI(raw) : null;
          if (ai && ai.reply){
            missed = 0;
            await botSay(ai.reply, {actions:ai.actions, chips:ASSISTANT.startChips});
            if (ai.handoff) await startHandoff(raw, text);
          } else {
            missed += 1;
            if (missed >= ASSISTANT.fallbackLimit) await startHandoff(raw, text);
            else await botSay(ASSISTANT.fallback, {chips:ASSISTANT.startChips});
          }
        }
      }
    } finally { busy = false; save(); }
    if (queue.length) handleUser(queue.shift());
  }

  /* ---------- hand-off to customer service ---------- */
  function contactActions(){
    if (B.whatsapp) return [{label:'Chat on WhatsApp', href:waUrl('Hello KASH, I was chatting on your website.'), icon:'whatsappLogo'}];
    return [{label:'WhatsApp not configured — view contact options', href:'#/contact', icon:'whatsappLogo'}];
  }
  async function startHandoff(raw, text){
    const H = ASSISTANT.handoff;
    missed = 0;
    if (safetyRx.some((r) => r.test(text))) await botSay(H.safety, {delay:350});
    /* "connecting..." with animated dots, then the sign-up form */
    const connecting = await botSay(toHtml(H.connecting) + '<span class="dots-anim"><i></i><i></i><i></i></span>', {raw:true, delay:450, cls:'connecting'});
    await wait(H.connectingMs);
    patch(connecting.id, {html:toHtml(H.connecting), cls:''});
    const form = `${toHtml(H.ask)}
      <form class="chat-form" data-handoff data-topic="${esc(raw.slice(0, 400))}" novalidate>
        <label>Your name<input name="name" autocomplete="name" required></label>
        <label>Phone number<input name="phone" type="tel" autocomplete="tel" placeholder="e.g. 0712 345 678" required></label>
        ${honeypot()}
        <p class="chat-consent">By sending this you agree to our <a href="#/privacy">Privacy Policy</a>.</p>
        <p class="chat-err" role="alert"></p>
        <button class="btn btn-amber btn-sm" type="submit">Send to customer service</button>
      </form>` + actionsHtml(contactActions());
    await botSay(form, {raw:true, delay:350, cls:'has-form', chips:['Back to the menu']});
  }

  async function submitHandoff(form){
    const H = ASSISTANT.handoff;
    const name = form.elements.name.value.trim(), phone = form.elements.phone.value.trim();
    const err = $('.chat-err', form);
    if (!name || phone.replace(/\D/g, '').length < 9){ err.textContent = 'Please add your name and a valid phone number.'; return; }
    err.textContent = '';
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending...';
    const transcript = msgs.slice(-14).map((m) => m.from + ': ' + stripHtml(m.html).slice(0, 300));
    const res = await submitRequest('handoff', {name, phone, website:form.elements.website.value, topic:form.dataset.topic, page:location.hash || '#/', transcript});
    if (!res.ok){
      btn.disabled = false; btn.textContent = 'Send to customer service';
      err.textContent = res.message || ("We couldn't send that just now. Please try again" + (B.email ? ', or email ' + B.email : '') + '.');
      return;
    }
    const formMsg = msgs.find((m) => m.html.indexOf('data-handoff') > -1);
    if (formMsg) patch(formMsg.id, {html:toHtml(H.ask), cls:''});   /* swap the form for plain text */
    await botSay(H.done.replace('{name}', name.split(' ')[0]).replace('{phone}', phone) + (res.mode === 'demo' ? '\n(Demo mode: not connected to the database yet.)' : ''),
      {actions:contactActions(), chips:ASSISTANT.startChips});
  }

  /* ---------- open / close ---------- */
  function setOpen(v){
    isOpen = v;
    if (v) setQuickActions(false);
    panel.hidden = !v;
    launcher.setAttribute('aria-expanded', String(v));
    document.body.classList.toggle('assistant-open', v);
    if (v){
      hideBubble();
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
      if (!msgs.length) startConversation(); else { render(); renderChips(); }
      setTimeout(() => inputEl.focus(), 60);
    }
  }
  function hideBubble(){ if (bubble) bubble.classList.remove('show'); }
  function maybeShowBubble(){
    let seen = false; try { seen = !!sessionStorage.getItem(SEEN_KEY); } catch (e) {}
    if (seen) return;
    setTimeout(() => { if (!isOpen){ bubble.classList.add('show'); setTimeout(hideBubble, 9000); } }, 5000);
  }

  /* ---------- start-up ---------- */
  function init(){
    if (CONF.enabled === false) return;
    host = document.getElementById('assistant');
    if (!host) return;
    const name = esc(CONF.name || 'KASH Assistant');
    host.innerHTML = `
      <div class="assistant-bubble" role="status">Hi! Need a hand?</div>
      <button class="assistant-launcher" type="button" aria-label="Chat with the ${name}" aria-expanded="false" aria-controls="assistantPanel" data-assistant-toggle>${ROBOT}</button>
      <section class="assistant-panel" id="assistantPanel" role="dialog" aria-label="${name}" hidden>
        <header class="assistant-head">
          <span class="assistant-avatar">${ROBOT}</span>
          <div><b>${name}</b><span><i></i> Here to help</span></div>
          <button type="button" class="assistant-icon" data-assistant-restart aria-label="Start over" title="Start over"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
          <button type="button" class="assistant-icon" data-assistant-toggle aria-label="Close chat"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </header>
        <div class="assistant-log" role="log" aria-live="polite"></div>
        <div class="assistant-chips"></div>
        <form class="assistant-input" autocomplete="off">
          <input type="text" aria-label="Type your message" placeholder="Type your question..." maxlength="500">
          <button type="submit" aria-label="Send"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
        </form>
      </section>`;
    panel = $('.assistant-panel', host); logEl = $('.assistant-log', host); chipsEl = $('.assistant-chips', host);
    inputEl = $('.assistant-input input', host); launcher = $('.assistant-launcher', host); bubble = $('.assistant-bubble', host);
    restore();

    host.addEventListener('click', (e) => {
      const t = e.target.closest('button, a'); if (!t) return;
      if (t.hasAttribute('data-assistant-toggle')) return setOpen(!isOpen);
      if (t.hasAttribute('data-assistant-restart')){ startConversation(); return; }
      if (t.dataset.chip){
        if (t.dataset.chip === 'Back to the menu'){ startConversation(); return; }
        return handleUser(t.dataset.chip);
      }
      if (t.classList.contains('chat-act') && isMobile()) setOpen(false);
    });
    host.addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.matches('[data-handoff]')) return submitHandoff(e.target);
      const v = inputEl.value; inputEl.value = ''; handleUser(v);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) setOpen(false); });
    bubble.addEventListener('click', () => setOpen(true));
    maybeShowBubble();
  }

  return {init, open:() => { if (panel) setOpen(true); }};
})();
