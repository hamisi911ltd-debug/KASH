/* =========================================================
   KASH - js/core/erp.js
   Pulls what staff publish in the KASH ERP (Website page) into the
   Products and Stays pages. If the ERP can't be reached, or nothing is
   published, the built-in lists are left exactly as they are.
   Resolves true when something changed and the page should redraw.
========================================================= */
'use strict';

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
      img:(l.images && l.images[0]) || l.imageUrl || 'chicken-whole.jpg', desc:l.description || ''
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
