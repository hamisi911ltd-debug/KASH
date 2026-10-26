/* =========================================================
   KASH - js/pages/legal.js
   Privacy policy, Terms & conditions and Cookies pages.
   The words themselves live in js/data/legal.js.
========================================================= */
'use strict';

const legalTokens = () => ({email:B.email, phone:B.phoneDisplay, location:B.location, hours:B.hours, months:LEGAL.retentionMonths});
const legalFill = (t) => esc(t.replace(/\{(\w+)\}/g, (m, k) => (legalTokens()[k] != null ? legalTokens()[k] : m)));
/* [text in square brackets] is a to-do for the owner: show it highlighted so it is not missed */
const legalMark = (t) => legalFill(t).replace(/\[([^\]]+)\]/g, '<mark class="todo">[$1]</mark>');

function legalPage(doc, current){
  const nav = [['privacy', 'Privacy Policy'], ['terms', 'Terms & conditions'], ['cookies', 'Cookies & storage']]
    .map(([k, l]) => `<a class="chip ${k === current ? 'on' : ''}" href="#/${k}">${esc(l)}</a>`).join('');
  const body = doc.sections.map((s) => `<section class="legal-sec"><h2>${legalFill(s.h)}</h2>
    ${(s.p || []).map((t) => `<p>${legalMark(t)}</p>`).join('')}
    ${s.ul ? `<ul>${s.ul.map((t) => `<li>${legalMark(t)}</li>`).join('')}</ul>` : ''}
    ${s.after ? `<p>${legalMark(s.after)}</p>` : ''}</section>`).join('');
  return heroPage({accent:'blue', crumbs:[[doc.title]], title:doc.title, lead:doc.lead}) + `
  <section class="section pt-20"><div class="wrap legal-doc">
    <div class="modes-more mb-26">${nav}</div>
    <p class="muted mb-18">Last updated: ${esc(LEGAL.updated)}</p>
    ${body}
    <p class="muted mt-28">Questions about this page? Contact us at <a href="mailto:${esc(B.email)}">${esc(B.email)}</a>.</p>
  </div></section>`;
}
function pagePrivacy(){ return legalPage(LEGAL.privacy, 'privacy'); }
function pageTerms(){ return legalPage(LEGAL.terms, 'terms'); }
function pageCookies(){ return legalPage(LEGAL.cookies, 'cookies'); }
