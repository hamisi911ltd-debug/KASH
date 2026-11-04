/* =========================================================
   KASH - js/core/install.js
   A friendly pop-up that offers to install the website as an app
   (Android and desktop Chrome/Edge), or shows how to add it to the
   Home Screen on an iPhone. Shown once in a while, never when already installed.
========================================================= */
'use strict';

(function(){
  const KEY = 'kash-install-dismissed', WAIT_DAYS = 14;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const dismissedRecently = () => { try { return Date.now() - (+localStorage.getItem(KEY) || 0) < WAIT_DAYS * 864e5; } catch (e) { return false; } };
  const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* private mode */ } };
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  let deferred = null, shown = false;

  function close(pop){ pop.classList.remove('show'); setTimeout(() => pop.remove(), 250); }
  function open(kind){
    if (shown || standalone() || document.querySelector('.install-pop')) return;
    shown = true;
    const pop = document.createElement('div');
    pop.className = 'install-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-labelledby', 'installTitle');
    const body = kind === 'ios'
      ? '<p>Tap <b>Share</b> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> at the bottom of Safari, then choose <b>Add to Home Screen</b>.</p>'
      : '<p>Order food, book a BnB or book transport in one tap. It opens like a normal app, even on a weak connection.</p>';
    pop.innerHTML = '<button class="install-x" type="button" aria-label="Close">&times;</button>'
      + '<div class="install-row"><img src="images/icon-192.png" alt="" width="56" height="56"><div><h3 id="installTitle">Get the KASH app</h3>' + body + '</div></div>'
      + '<div class="install-actions">' + (kind === 'ios' ? '<button class="btn btn-amber" data-install-ok type="button">Got it</button>' : '<button class="btn btn-amber" data-install-go type="button">Install app</button><button class="btn btn-ghost-dark" data-install-no type="button">Not now</button>') + '</div>';
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add('show'));
    const done = () => { remember(); close(pop); };
    pop.querySelector('.install-x').addEventListener('click', done);
    const no = pop.querySelector('[data-install-no]'); if (no) no.addEventListener('click', done);
    const ok = pop.querySelector('[data-install-ok]'); if (ok) ok.addEventListener('click', done);
    const go = pop.querySelector('[data-install-go]');
    if (go) go.addEventListener('click', async () => {
      if (!deferred) return done();
      deferred.prompt();
      try { await deferred.userChoice; } catch (e) { /* ignore */ }
      deferred = null; done();
    });
  }
  /* Wait a moment (and a little scrolling) so the pop-up never covers the first screen. */
  function offerSoon(kind){
    if (standalone() || dismissedRecently()) return;
    let armed = false;
    const onScroll = () => { if (window.scrollY > 400) fire(); };
    const fire = () => { if (armed) return; armed = true; window.removeEventListener('scroll', onScroll); setTimeout(() => open(kind), 600); };
    window.addEventListener('scroll', onScroll, {passive:true});
    setTimeout(fire, 12000);
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; offerSoon('prompt'); });
  window.addEventListener('appinstalled', () => { deferred = null; remember(); const p = document.querySelector('.install-pop'); if (p) close(p); });
  if (iOS && !standalone()) window.addEventListener('load', () => offerSoon('ios'));
})();
