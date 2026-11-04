/* =========================================================
   KASH - js/pages/reviews.js
   Customer reviews: a clear form to write one, and the approved reviews.
   Every review is saved as "Pending" in the KASH ERP and only appears here
   once an admin approves it (see the Reviews page in the ERP).
========================================================= */
'use strict';

const REVIEW_SERVICE_OPTIONS = ['Transport & logistics', 'Agriculture & food', 'Hospitality & stays', 'General'];
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const reviewStars = (n) => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? '' : 'off'}">${ico('star')}</span>`).join('')}</span>`;
const reviewInitials = (name) => (String(name || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2) || '?').toUpperCase();
const reviewDate = (d) => { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString('en-KE', {month:'long', year:'numeric'}); };

function reviewCard(r){
  return `<article class="review-card rv" data-rv>
    ${reviewStars(r.rating)}
    ${r.title ? `<h3>${esc(r.title)}</h3>` : ''}
    <p>${esc(r.body)}</p>
    <div class="review-who"><div class="review-avatar" aria-hidden="true">${esc(reviewInitials(r.name))}</div>
      <div><b>${esc(r.name)}</b><span>${esc(r.service || 'KASH customer')}${r.date ? ' · ' + esc(reviewDate(r.date)) : ''}</span></div></div>
  </article>`;
}

function reviewSummary(list){
  if (!list.length) return '';
  const avg = list.reduce((t, r) => t + r.rating, 0) / list.length;
  const rows = [5, 4, 3, 2, 1].map((n) => { const c = list.filter((r) => r.rating === n).length; return `<div><span>${n}</span><i><b style="width:${Math.round(c / list.length * 100)}%"></b></i><span>${c}</span></div>`; }).join('');
  return `<div class="review-summary rv rv-pop" data-rv><div class="review-score">${avg.toFixed(1)}<small>out of 5</small></div>
    <div>${reviewStars(Math.round(avg))}<p class="muted" style="margin:6px 0 0">Based on ${list.length} approved review${list.length > 1 ? 's' : ''}</p></div>
    <div class="review-bars" aria-hidden="true">${rows}</div></div>`;
}

/* Fills every review spot on the current page from the approved reviews. */
function showReviews(){
  const grid = $('[data-public-reviews]'), sum = $('[data-review-summary]');
  if (!grid) return;
  if (!reviewsLoaded){ grid.textContent = 'Loading customer reviews…'; return; }
  const limit = +grid.dataset.limit || 0, list = limit ? REVIEWS.slice(0, limit) : REVIEWS;
  if (sum) sum.innerHTML = reviewSummary(REVIEWS);
  grid.innerHTML = list.length ? list.map(reviewCard).join('') : `<div class="review-empty rv" data-rv style="grid-column:1/-1">No reviews yet. Be the first to <a href="#/reviews">share your experience</a>.</div>`;
  revealOnScroll();
}

function reviewForm(){
  const stars = [5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rate${n}" value="${n}" data-rating-word="${RATING_WORDS[n]}"><label for="rate${n}" title="${n} star${n > 1 ? 's' : ''}: ${RATING_WORDS[n]}"><span class="sr-only">${n} star${n > 1 ? 's' : ''}, ${RATING_WORDS[n]}</span>${ico('star')}</label>`).join('');
  return `<form class="form" data-kind="review" novalidate>
    <fieldset class="rating-field"><legend>Your rating <span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></legend>
      <div class="star-input">${stars}</div><div class="rating-word" id="ratingWord" aria-live="polite">Tap a star</div><span class="err" role="alert">Please tap a star to rate your experience.</span></fieldset>
    <div class="row">
      ${field({label:'Your name', name:'name', req:true, ac:'name', id:'r_name', ph:'e.g. Amina Wanjiru', hint:'Shown with your review as your first name and last initial, like Amina W.', attrs:'minlength="2" maxlength="80"'})}
      ${field({label:'Your email', name:'email', type:'email', req:true, ac:'email', id:'r_email', ph:'name@example.com', hint:'Only for KASH, in case we need to check your review. We never show or share it.', attrs:'maxlength="160"'})}
    </div>
    ${selectField({label:'Which service did you use?', name:'service', options:REVIEW_SERVICE_OPTIONS, value:'General', id:'r_service'})}
    ${field({label:'Review title (optional)', name:'title', id:'r_title', ph:'e.g. Fast, careful delivery', hint:'A short headline, up to 80 characters.', attrs:'maxlength="80"'})}
    <div class="field"><label for="r_body">Your review <span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>
      <textarea id="r_body" name="body" rows="5" required minlength="20" maxlength="800" data-count="r_count" placeholder="Tell us what went well and what we could do better." aria-describedby="r_count"></textarea>
      <span class="hint">Write at least 20 characters. Please don’t include phone numbers or other private details.</span>
      <span class="char-count" id="r_count" aria-live="polite">0 / 800</span><span class="err" role="alert">Please write your review.</span></div>
    <div class="field check-field"><label><input type="checkbox" name="consent" value="yes"><span>I agree that KASH General Suppliers may publish my review and name on its website after approval. I have read the <a href="#/privacy">Privacy Policy</a>.</span></label><span class="err" role="alert"></span></div>
    ${honeypot()}<div class="notice" data-notice role="alert"></div>
    <button class="btn btn-amber btn-block" type="submit">Submit my review</button>
    <p class="hint" style="margin-top:10px">Your review is checked by our team first, so it may take a little while to appear.</p>
  </form>`;
}

function pageReviews(){
  return heroPage({accent:'amber', crumbs:[['Customer reviews']], title:'Customer reviews',
    lead:'Real feedback from people who have used KASH. Share your own experience and help others choose with confidence.'}) + `
  <section class="section pt-20"><div class="wrap review-layout">
    <div><h2 class="sm mb-16 rv" data-rv>What customers say</h2><div data-review-summary></div>
      <div class="review-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))" data-public-reviews aria-live="polite">Loading customer reviews…</div></div>
    <aside class="review-form-card rv rv-right" id="reviewFormCard" data-rv><h2>Write a review</h2><p class="sub">It takes about a minute. Fields marked <span class="req">*</span> are required.</p>${reviewForm()}</aside>
  </div></section>`;
}

/* Called by the shared submit handler once the form has passed its checks. */
async function submitReviewForm(form){
  const btn = $('button[type=submit]', form), label = btn.innerHTML, note = $('[data-notice]', form);
  btn.disabled = true; btn.textContent = 'Sending…';
  const d = {}; new FormData(form).forEach((v, k) => { d[k] = v; });
  const result = await sendErpReview({name:d.name, email:d.email, service:d.service, rating:+d.rating, title:d.title, body:d.body, consent:d.consent === 'yes', website:d.website || ''});
  if (!result.ok){
    btn.disabled = false; btn.innerHTML = label;
    if (note){ note.textContent = result.message; note.classList.add('show'); }
    return;
  }
  const card = $('#reviewFormCard') || form.parentElement;
  card.innerHTML = `<div class="review-thanks"><div class="tick">${ico('check')}</div><h2>Thank you, ${esc((d.name || '').split(' ')[0])}!</h2>
    <p>Your review has been sent to our team. It will appear on the website once it has been approved.</p>
    <p class="hint">We may contact you at ${esc(d.email)} if we need to check anything.</p>
    <a class="btn btn-outline" href="#/">Back to home</a></div>`;
}

document.addEventListener('change', (e) => {
  const r = e.target.closest && e.target.closest('input[name="rating"]');
  if (r){ const w = $('#ratingWord'); if (w) w.textContent = r.value + ' of 5: ' + r.dataset.ratingWord; const g = r.closest('.rating-field'); if (g) g.classList.remove('invalid'); }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches && t.matches('textarea[data-count]')){ const c = $('#' + t.dataset.count); if (c) c.textContent = t.value.length + ' / ' + (t.maxLength || 800); }
});

/* Scroll reveal: items with data-rv slide and fade in as they come into view, one after another. */
let rvObserver = null;
function revealOnScroll(){
  const items = $$('[data-rv]:not(.in)');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches){ items.forEach((el) => el.classList.add('in')); return; }
  if (!rvObserver) rvObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting){ en.target.classList.add('in'); rvObserver.unobserve(en.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  let i = 0;
  items.forEach((el) => { el.style.setProperty('--d', Math.min(i++ % 6, 5) * 90 + 'ms'); rvObserver.observe(el); });
}
