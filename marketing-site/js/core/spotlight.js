/* =========================================================
   KASH - js/core/spotlight.js
   A temporary picture pop-up shown when the website opens (once per visit).
   To take it down: delete this file and its <script> line in index.html.
========================================================= */
'use strict';

(function(){
  try { if (sessionStorage.getItem('kash-spotlight')) return; } catch (e) { /* private mode: show anyway */ }
  function show(){
    var pop = document.createElement('div');
    pop.className = 'spot'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Featured picture');
    pop.innerHTML = '<div class="spot-card"><button class="spot-x" type="button" aria-label="Close">&times;</button><img src="images/spotlight.jpg" alt="Moana and Maui" width="452" height="678"></div>';
    document.body.appendChild(pop);
    requestAnimationFrame(function(){ pop.classList.add('show'); });
    function close(){ try { sessionStorage.setItem('kash-spotlight', '1'); } catch (e) { /* ignore */ } pop.classList.remove('show'); setTimeout(function(){ pop.remove(); }, 300); document.removeEventListener('keydown', onKey); }
    function onKey(e){ if (e.key === 'Escape') close(); }
    pop.addEventListener('click', function(e){ if (e.target === pop || e.target.closest('.spot-x')) close(); });
    document.addEventListener('keydown', onKey);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(show, 400); }); else setTimeout(show, 400);
})();
