/* =========================================================
   KASH - js/pages/quote.js
   "Get a quote": the chooser (truck, Uber, tuk-tuk, delivery, more) and each request form.
========================================================= */
'use strict';

function modeOf(param){
  if (!param) return '';
  const all = QUOTE_MODES.concat(QUOTE_MORE);
  if (all.some((m) => m.key === param)) return param;
  return MODE_ALIASES[param] || '';
}
function quoteListPanel(){
  const total = cartTotal();
  const list = cart.length ? cart.map((i) => `<div class="cart-line">${i.img ? `<img src="${imgSrc(esc(i.img))}" alt="">` : `<div class="ph">${ico('leaf')}</div>`}
      <div class="grow"><b>${esc(i.name)}</b><small>${i.price ? 'KES ' + money(i.price) + ' / ' + esc(i.unit) : "Ask for today's price"}</small></div>
      <div class="qty"><button data-qty="-1" data-id="${esc(i.id)}" aria-label="Fewer">${ico('minus')}</button><b>${i.qty}</b><button data-qty="1" data-id="${esc(i.id)}" aria-label="More">${ico('plus')}</button><button class="rm" data-remove="${esc(i.id)}" aria-label="Remove">${ico('trash')}</button></div></div>`).join('') +
    (total ? `<div class="cart-total"><span>Estimated total</span><span>KES ${money(total)}</span></div>` : '') + `<p class="muted" style="font-size:.85rem;margin-top:10px">We confirm today's price for every item in your quote.</p>`
    : `<p class="muted">Nothing added yet. <a href="#/products" style="color:var(--link);font-weight:700">Browse products</a> to build a list, or just tell us what you need.</p>`;
  return `<div class="panel"><h3 style="font-weight:800;font-size:1.2rem;margin-bottom:12px">Your quote list</h3>${list}</div>`;
}
/* A place on a ride or delivery form: typed, found on the map (Find on map), or from the phone's location (pickup only). Exact coordinates travel with the request. */
const placeField = ({id, name, label, ph, err, locate=false}) => {
  const [la, ln, src] = PLACE_FIELDS[name];
  return `<div class="field spot" data-place="${name}"><label for="${id}">${label} <span class="req">*</span></label>
    <div class="with-btn"><input id="${id}" name="${name}" required placeholder="${esc(ph)}" autocomplete="off" aria-describedby="${id}_s">
      ${locate ? `<button class="btn btn-navy btn-sm" type="button" data-locate>${ico('locate')} Use my location</button>` : ''}
      <button class="btn btn-outline btn-sm" type="button" data-geo-find>${ico('search')} Find on map</button></div>
    <span class="err">${err}</span><ul class="geo-list" data-geo-list hidden></ul>
    <div class="locate-status" id="${id}_s" data-place-status role="status" aria-live="polite"></div>
    <input type="hidden" name="${la}"><input type="hidden" name="${ln}"><input type="hidden" name="${src}">${name === 'pickup' ? '<input type="hidden" name="pickupAccuracy">' : ''}</div>`;
};
function vehicleBrief(v){
  if (!v) return '';
  return `<div class="cardx acc-${v.group === 'freight' ? 'blue' : 'amber'} mt-20">${media({img:v.img, alt:v.name, icon:VEHICLE_ICON[v.category], tag:v.sub, state:'Available', accent:v.group === 'freight' ? 'blue' : 'amber', pos:v.pos})}
    <div class="body"><h3>${v.name}</h3><div class="meta"><span>${ico('users')} ${v.capacity}</span></div><p>Best for: ${v.best}</p></div></div>`;
}
function panelTruck(preset){
  const pre = rateByName(preset);
  return `<div class="mode-panel acc-blue"><div class="form-card"><h3 class="form-title">Request a truck</h3>
    <p class="muted mb-18">Tell us what you are moving and we'll confirm the truck and the price.</p>
    <div data-form-wrap><form class="form" data-kind="truck" ${pre ? 'data-rate-to="' + esc(pre.to) + '"' : ''} novalidate>
      <div class="row">${field({label:'Your name', name:'name', req:true, ac:'name', id:'t_name'})}${field({label:'Phone number', name:'phone', type:'tel', req:true, ac:'tel', ph:'e.g. 0712 345 678', id:'t_phone'})}</div>
      ${ratePicker(pre ? pre.id : '')}
      <div class="row">${field({label:'Pickup place', name:'from', ph:'Where should we collect?', id:'t_from', value:pre ? 'Nairobi ICD / CFS depot' : ''})}${field({label:'Drop-off place', name:'to', ph:'Where is it going?', id:'t_to', value:pre ? pre.to : ''})}</div>
      ${field({label:'Preferred date', name:'date', type:'date', attrs:'min="' + todayISO() + '"', id:'t_date'})}
      ${textArea({label:'What are we moving?', name:'details', rows:3, ph:'e.g. 5 tonnes of maize, furniture for a 2-bedroom house'})}
      ${honeypot()}${consentNote()}<div class="notice" data-notice role="alert"></div>
      <button class="btn btn-amber btn-block" type="submit">Request truck</button>
    </form></div></div>
    <aside>${vehicleBrief(VEHICLES.find((v) => v.mode === 'truck'))}<div class="panel mt-20">${checks(FREIGHT_WHY.slice(0, 4))}</div></aside></div>`;
}
function panelRide(mode){
  const v = VEHICLES.find((x) => x.mode === mode), tuk = mode === 'tuktuk', max = tuk ? 3 : 4;
  return `<div class="mode-panel acc-${tuk ? 'teal' : 'amber'}"><div class="form-card"><h3 class="form-title">Request ${tuk ? 'a tuk-tuk' : 'an Uber / cab'}</h3>
    <p class="muted mb-18">Tell us where you are and where you're going. Pin both places on the map and we'll confirm a driver and the price on the phone.</p>
    <div data-form-wrap><form class="form" data-kind="ride" data-mode="${mode}" novalidate>
      <div class="row">${field({label:'Your name', name:'name', req:true, ac:'name', id:'r_name'})}${field({label:'Phone number', name:'phone', type:'tel', req:true, ac:'tel', ph:'e.g. 0712 345 678', id:'r_phone'})}</div>
      ${placeField({id:'r_pickup', name:'pickup', label:'Pickup place', ph:'e.g. Westlands, Nairobi', err:'Add your pickup place, or tap Use my location.', locate:true})}
      ${placeField({id:'r_drop', name:'dropoff', label:'Where to?', ph:'e.g. Jomo Kenyatta Airport', err:'Add where you are going.'})}
      <div class="field"><label for="r_when">When do you need it?</label><select id="r_when" name="when" data-when><option value="now">As soon as possible</option><option value="later">At a set date and time</option></select></div>
      <div class="row later-row" data-later hidden>${field({label:'Date', name:'date', type:'date', attrs:'min="' + todayISO() + '"', id:'r_date'})}${field({label:'Time', name:'time', type:'time', id:'r_time'})}</div>
      <div class="field"><label for="r_pax">Passengers</label><select id="r_pax" name="passengers">${Array.from({length:max}, (_, i) => `<option>${i + 1}</option>`).join('')}</select></div>
      ${textArea({label:'Notes for the driver (optional)', name:'details', rows:2, ph:'Gate or house number, a landmark, a flight number...'})}
      ${honeypot()}${consentNote()}<div class="notice" data-notice role="alert"></div>
      <button class="btn btn-amber btn-block" type="submit">Request ${tuk ? 'tuk-tuk' : 'ride'}</button>
    </form></div></div>
    <aside><div id="rideLive">${rideLiveHtml(mode, userPos ? {pickup:userPos} : null)}</div>${vehicleBrief(v)}</aside></div>`;
}
function panelDelivery(){
  return `<div class="mode-panel acc-red"><div class="form-card"><h3 class="form-title">Request a delivery</h3>
    <p class="muted mb-18">A KASH rider collects it and brings it to the door. We confirm the price before we ride.</p>
    <div data-form-wrap><form class="form" data-kind="delivery" novalidate>
      <div class="row">${field({label:'Your name', name:'name', req:true, ac:'name', id:'d_name'})}${field({label:'Phone number', name:'phone', type:'tel', req:true, ac:'tel', ph:'e.g. 0712 345 678', id:'d_phone'})}</div>
      ${placeField({id:'d_pickup', name:'pickup', label:'Pickup place', ph:'e.g. Westlands, Nairobi', err:'Add the pickup place, or tap Use my location.', locate:true})}
      ${placeField({id:'d_drop', name:'dropoff', label:'Deliver to', ph:'Address or landmark', err:'Add the delivery address.'})}
      <div class="row">${field({label:'Receiver name', name:'receiver', id:'d_rname'})}${field({label:'Receiver phone', name:'receiverPhone', type:'tel', id:'d_rphone'})}</div>
      ${selectField({label:'What are you sending?', name:'size', options:['Documents or small parcel', 'Medium box', 'Large or heavy item'], id:'d_size'})}
      ${textArea({label:'Notes for the rider', name:'details', rows:2, ph:'Anything we should know?'})}
      ${honeypot()}${consentNote()}<div class="notice" data-notice role="alert"></div>
      <button class="btn btn-amber btn-block" type="submit">Request delivery</button>
    </form></div></div>
    <aside>${deliveryStage()}<div class="panel mt-20">${checks(['Fast: quick dispatch for city runs', 'Safe: handled with care, door to door', 'Reliable: confirmed price, honest timing'])}</div></aside></div>`;
}
function panelEnquiry(service){
  return `<div class="quote-grid" style="margin-top:34px;scroll-margin-top:90px"><div>${enquiryForm({service, extended:true})}</div>
    <div>${quoteListPanel()}<div class="panel mt-22"><h3 style="font-weight:800;font-size:1.2rem">Prefer to talk?</h3>${contactList()}</div></div></div>`;
}
function pageQuote(param){
  const parts = String(param || '').split('/'), mode = modeOf(parts[0]) || modeOf(param), preset = parts.slice(1).join('/');
  const tile = (m) => `<a class="mode acc-${m.color} ${mode === m.key ? 'on' : ''}" href="#/quote/${m.key}" aria-current="${mode === m.key}"><div class="badge ${COLOR[m.color]}">${ico(m.icon)}</div><b>${m.title}</b><span class="s">${m.sub}</span></a>`;
  const more = QUOTE_MORE.map((m) => `<a class="chip ${mode === m.key ? 'on' : ''}" href="#/quote/${m.key}">${ico(m.icon)} ${m.title}</a>`).join('');
  let panel;
  if (mode === 'truck') panel = panelTruck(preset);
  else if (mode === 'uber' || mode === 'tuktuk') panel = panelRide(mode);
  else if (mode === 'delivery') panel = panelDelivery();
  else if (mode) panel = panelEnquiry((QUOTE_MORE.find((m) => m.key === mode) || {}).service);
  else panel = `<div class="mode-hint"><p><b>Choose an option above to get started.</b></p></div>`;
  return heroPage({accent:'amber', crumbs:[['Get a quote']], title:'What do you need today?', lead:'Pick one below. It only takes a minute, and no payment is needed to ask.'}) + `
  <section class="section pt-20"><div class="wrap">
    <div class="modes">${QUOTE_MODES.map(tile).join('')}</div>
    <div class="modes-more"><span class="muted">Or:</span>${more}</div>
    <div id="modePanel" style="scroll-margin-top:90px">${panel}</div>
  </div></section>`;
}
