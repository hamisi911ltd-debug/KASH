/* =========================================================
   KASH - js/core/utils.js
   Small shared helpers: DOM shortcuts, formatting, contact links.
========================================================= */
'use strict';

const CFG = window.KASH_CONFIG || {business:{}, supabase:{}};
const B = CFG.business || {};
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
const money = (n) => Number(n).toLocaleString('en-KE');
/* A photo from images/ (bundled) or a full https link (e.g. uploaded in the ERP). */
const imgSrc = (f) => /^https?:\/\//.test(f) ? f : 'images/' + f;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const COLOR = {teal:'c-teal', blue:'c-blue', amber:'c-amber', red:'c-red'};

/* ---------- contact helpers ---------- */
const waUrl = (msg) => B.whatsapp ? 'https://wa.me/' + B.whatsapp.replace(/\D/g, '') + (msg ? '?text=' + encodeURIComponent(msg) : '') : '';
const mailUrl = (sub, body) => 'mailto:' + (B.email || '') + '?subject=' + encodeURIComponent(sub || 'Enquiry') + (body ? '&body=' + encodeURIComponent(body) : '');
const telUrl = () => B.phoneTel ? 'tel:' + B.phoneTel.replace(/\s/g, '') : '';
