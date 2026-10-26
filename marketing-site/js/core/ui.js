/* =========================================================
   KASH - js/core/ui.js
   Toast message and the pop-up window (modal).
========================================================= */
'use strict';

let toastTimer;
function toast(msg){
  const el = $('#toast');
  el.innerHTML = ico('check') + '<span></span>';
  $('span', el).textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}
let lastFocus = null;
function openModal(html){
  lastFocus = document.activeElement;
  $('#modal').innerHTML = '<button class="modal-x" data-close aria-label="Close">' + ico('close') + '</button>' + html;
  $('#overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = $('#modal input, #modal textarea, #modal select'); if (first) setTimeout(() => first.focus(), 50);
}
function closeModal(){
  $('#overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
