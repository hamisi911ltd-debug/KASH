/* =========================================================
   KASH - js/core/erp.js
   Pulls what staff publish in the KASH ERP (Website page) into the
   Products and Stays pages. If the ERP can't be reached, or nothing is
   published, the built-in lists are left exactly as they are.
   Resolves true when something changed and the page should redraw.
========================================================= */
'use strict';

/* The Transport rate card staff keep in the ERP. If it can't be reached, or nothing is published yet, the built-in card stays. Resolves true when the card changed. */
async function loadErpRates(){
  const erp = ((CFG.api && CFG.api.erpUrl) || '').replace(/\/+$/, '');
  if (!erp) return false;
  try {
    const res = await fetch(erp + '/api/public/rates');
    if (!res.ok) return false;
    const list = await res.json();
    const rows = Array.isArray(list) ? list.filter((r) => r && r.destination && Number(r.amount) > 0).map((r) => ({id:String(r.id), to:String(r.destination), kes:Math.round(Number(r.amount))})) : [];
    if (!rows.length) return false;
    RATE_CARD.rates = rows;
    return true;
  } catch (e) { return false; }
}

/* Customer reviews. Only reviews an admin has approved come back from the ERP. */
let REVIEWS = [], reviewsLoaded = false;
async function loadErpReviews(){
  const erp = ((CFG.api && CFG.api.erpUrl) || '').replace(/\/+$/, '');
  if (!erp) return false;
  try {
    const res = await fetch(erp + '/api/public/reviews');
    if (!res.ok) return false;
    const list = await res.json();
    REVIEWS = Array.isArray(list) ? list.filter((r) => r && r.body && r.rating >= 1 && r.rating <= 5) : [];
    reviewsLoaded = true;
    return true;
  } catch (e) { return false; }
}
/* Sends a review to the ERP, where it waits for an admin. Resolves {ok:true} or {ok:false, message}. */
async function sendErpReview(payload){
  const erp = ((CFG.api && CFG.api.erpUrl) || '').replace(/\/+$/, '');
  if (!erp) return {ok:false, message:'Reviews are not available right now. Please try again later or contact us on WhatsApp.'};
  try {
    const res = await fetch(erp + '/api/public/reviews', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    if (res.ok) return {ok:true};
    let message = 'We could not send your review. Please try again.';
    try { const j = await res.json(); if (j && j.error) message = j.error; } catch (e) { /* keep the default */ }
    return {ok:false, message};
  } catch (e) { return {ok:false, message:'We could not reach the server. Check your internet connection and try again.'}; }
}
async function loadErpListings(){
  const erp = ((CFG.api && CFG.api.erpUrl) || '').replace(/\/+$/, '');
  if (!erp) return false;
  const get = async (division) => {
    try {
      const res = await fetch(erp + '/api/public/listings?division=' + division);
      return res.ok ? await res.json() : [];
    } catch (e) { return []; }
  };
  const [food, stays] = await Promise.all([get('Food'), get('Hospitality')]);
  let changed = false;
  const num = (re, s, d) => { const m = String(s || '').match(re); return m ? +m[1] : d; };

  if (food.length){
    const fresh = food.filter((l) => !PRODUCTS.some((p) => p.id === 'erp-' + l.id)).map((l) => ({
      id:'erp-' + l.id, name:l.title, category:'Other', tag:l.meta || 'Fresh', price:l.price || null, unit:'',
      img:(l.images && l.images[0]) || l.imageUrl || 'fallback/chicken-whole.webp', desc:l.description || ''
    }));
    if (fresh.length){ fresh.forEach((p) => PRODUCTS.push(p)); changed = true; }
  }
  if (stays.length){
    const mapped = stays.map((l) => ({
      id:'erp-' + l.id, lat:BASE().lat, lng:BASE().lng, approx:true, name:l.title, city:'Nairobi', location:'Nairobi, Kenya', type:'Apartment',
      beds:num(/(\d+)\s*bed/i, l.meta, 1), baths:num(/(\d+)\s*bath/i, l.meta, 1), guests:num(/(\d+)\s*guest/i, l.meta, 2), wifi:true,
      price:l.price || 0, rating:'', reviews:0, img:(l.images && l.images[0]) || l.imageUrl || 'house.jpg', pos:'50% 50%',
      gallery:(l.images || []).slice(),
      desc:l.description || '', amenities:(l.amenities || []).map((a) => { AMENITY_LABELS[a] = a; if (!ICONS[a]) ICONS[a] = ICONS.check || ''; return a; })
    }));
    PROPERTIES.length = 0; mapped.forEach((p) => PROPERTIES.push(p)); changed = true;
  }
  return changed;
}
