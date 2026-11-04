/* =========================================================
   KASH - js/core/maps.js
   Distance maths, embedded maps and the "use my location" button.
========================================================= */
'use strict';

/* ---------- maps + "use my location" ---------- */
const toRad = (d) => d * Math.PI / 180;
function distKm(a, b){
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}
const BASE = () => (B.base && typeof B.base.lat === 'number') ? B.base : {lat:-1.2921, lng:36.8219, label:'KASH base'};
let userPos = null;
const osmEmbed = (minLng, minLat, maxLng, maxLat, mLat, mLng) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${minLng.toFixed(5)},${minLat.toFixed(5)},${maxLng.toFixed(5)},${maxLat.toFixed(5)}&layer=mapnik&marker=${mLat},${mLng}`;
const gmapPin = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const gmapDir = (from, to) => `https://www.google.com/maps/dir/?api=1${from ? `&origin=${from.lat},${from.lng}` : ''}&destination=${to.lat},${to.lng}&travelmode=driving`;
function mapBox(src, label){
  return `<div class="mapbox"><div class="map-fallback"><div>${ico('pin')}<b>${esc(label)}</b><span>Map preview</span></div></div>
    <iframe title="Map: ${esc(label)}" src="${src}" loading="lazy" referrerpolicy="no-referrer"></iframe></div>`;
}
/* Where the pickup and drop-off are right now, read from the form (null when not pinned on the map). */
function ridePoints(form){
  const pt = (a, b) => {
    const la = form.elements[a], ln = form.elements[b]; if (!la || !ln) return null;
    const lat = parseFloat(la.value), lng = parseFloat(ln.value);
    return isFinite(lat) && isFinite(lng) ? {lat, lng} : null;
  };
  const pickup = pt('lat', 'lng'), drop = pt('dropLat', 'dropLng');
  const acc = form.elements.pickupAccuracy ? parseInt(form.elements.pickupAccuracy.value, 10) : 0;
  if (pickup && acc) pickup.acc = acc;
  return {pickup, drop};
}
/* Straight line x 1.35: a fair guess at the road distance in a city. Always shown as an estimate. */
const roadKm = (a, b) => distKm(a, b) * 1.35;
const kmText = (km) => km < 10 ? km.toFixed(1) : String(Math.round(km));
const minsFor = (km, mode, least) => Math.max(least, Math.round(km / RIDE_SPEED[mode] * 60));
function bboxFor(a, b){
  const padLat = Math.max(0.008, Math.abs(a.lat - b.lat) * 0.35), padLng = Math.max(0.008, Math.abs(a.lng - b.lng) * 0.35);
  return [Math.min(a.lng, b.lng) - padLng, Math.min(a.lat, b.lat) - padLat, Math.max(a.lng, b.lng) + padLng, Math.max(a.lat, b.lat) + padLat];
}
function rideLiveHtml(mode, pts){
  const name = mode === 'tuktuk' ? 'tuk-tuk' : 'cab';
  const pickup = pts && pts.pickup, drop = pts && pts.drop;
  if (!pickup) return `<div class="live-empty">${ico('locate')}<b>Pin your pickup</b><p>Tap “Use my location” or “Find on map” and we'll show how far our ${name} is from you${' and how long your trip will be'}.</p></div>`;
  const base = BASE(), toYou = roadKm(base, pickup), arrive = minsFor(toYou, mode, 2), far = toYou > 80;
  const arrives = `<div><b>${far ? 'Call us' : '~' + arrive + ' min'}</b><span>${far ? 'You are far from our base' : 'for the ' + name + ' to reach you'}</span></div>`;
  if (drop){
    const trip = roadKm(pickup, drop), [a, b, c, d] = bboxFor(pickup, drop);
    return `<div class="live">
      <div class="live-stats three"><div><b>~${kmText(trip)} km</b><span>trip distance</span></div><div><b>~${minsFor(trip, mode, 3)} min</b><span>time on the road</span></div>${arrives}</div>
      ${mapBox(osmEmbed(a, b, c, d, pickup.lat, pickup.lng), 'Your trip')}
      <div class="map-actions"><a class="btn btn-outline btn-sm" href="${gmapDir(pickup, drop)}" target="_blank" rel="noopener">${ico('pin')} Route on Google Maps</a></div>
      <p class="trip-note">The pin marks your pickup. Distances and times are estimates. We confirm the driver and the price on the phone before the trip, and nothing is charged now.</p></div>`;
  }
  const [a, b, c, d] = bboxFor(base, pickup);
  const path = 'M70 86 C 190 18, 330 126, 530 52';
  return `<div class="live">
    <div class="live-stats"><div><b>${kmText(toYou)} km</b><span>${esc(base.label)} to you</span></div>${arrives}</div>
    <div class="route"><svg viewBox="0 0 600 130" role="img" aria-label="A ${name} driving from KASH to your location">
      <path class="rpath" d="${path}"/>
      <circle cx="70" cy="86" r="13" fill="#0a1f3d"/><text x="70" y="91" text-anchor="middle" fill="#fff" font-size="13" font-weight="800">K</text>
      <text x="70" y="116" text-anchor="middle" class="rlbl">KASH</text>
      <g transform="translate(530 52)"><path d="M0 -24 c-10 0 -16 7 -16 15 c0 11 16 26 16 26 s16 -15 16 -26 c0 -8 -6 -15 -16 -15z" fill="#e01b34"/><circle cy="-9" r="6" fill="#fff"/></g>
      <text x="530" y="90" text-anchor="middle" class="rlbl">You</text>
      <g><animateMotion dur="5s" repeatCount="indefinite" path="${path}" rotate="0"/>
        <circle r="17" fill="#ffb51a"/><rect x="-9" y="-6" width="18" height="9" rx="3" fill="#0a1f3d"/><circle cx="-5" cy="5" r="2.6" fill="#0a1f3d"/><circle cx="5" cy="5" r="2.6" fill="#0a1f3d"/></g>
    </svg></div>
    ${mapBox(osmEmbed(a, b, c, d, pickup.lat, pickup.lng), 'Your location')}
    <div class="map-actions"><a class="btn btn-outline btn-sm" href="${gmapDir(base, pickup)}" target="_blank" rel="noopener">${ico('pin')} Route on Google Maps</a></div>
    <p class="trip-note">Add where you are going to see the trip distance. This is an estimate from ${esc(base.label)}. Live driver tracking will show here once our vehicles carry GPS.</p></div>`;
}

/* ---------- a pickup / drop-off place: typed, found on the map, or from the phone's location ---------- */
const PLACE_FIELDS = {pickup:['lat', 'lng', 'pickupSource'], dropoff:['dropLat', 'dropLng', 'dropSource']};
function placeStatus(wrap, msg, ok){
  const st = $('[data-place-status]', wrap);
  st.textContent = msg || ''; st.className = 'locate-status' + (msg ? ' show ' + (ok ? 'ok' : 'bad') : '');
}
function refreshRideCard(form){
  const live = $('#rideLive');
  if (live && form.dataset.kind === 'ride') live.innerHTML = rideLiveHtml(form.dataset.mode, ridePoints(form));
}
function hidePlaceList(wrap){ const ul = $('[data-geo-list]', wrap); ul.hidden = true; ul.innerHTML = ''; }
function setPlace(wrap, p){
  const form = wrap.closest('form'), key = wrap.dataset.place, [la, ln, src] = PLACE_FIELDS[key], input = wrap.querySelector('input[name="' + key + '"]');
  if (p.label) input.value = p.label;
  wrap.dataset.label = input.value; wrap.dataset.pinned = '1';
  form.elements[la].value = p.lat.toFixed(6); form.elements[ln].value = p.lng.toFixed(6); form.elements[src].value = p.source || '';
  if (key === 'pickup' && form.elements.pickupAccuracy) form.elements.pickupAccuracy.value = p.acc || '';
  wrap.classList.remove('invalid'); hidePlaceList(wrap);
  if (p.source === 'gps'){
    placeStatus(wrap, 'Pinned from your location (accurate to about ' + p.acc + ' m).' + (p.acc > 300 ? ' That is not very precise, so please check the place above and add a landmark.' : ''), p.acc <= 300);
  } else placeStatus(wrap, 'Pinned on the map.', true);
  refreshRideCard(form);
}
function clearPlace(wrap){
  const form = wrap.closest('form'), key = wrap.dataset.place;
  PLACE_FIELDS[key].forEach((n) => { form.elements[n].value = ''; });
  if (key === 'pickup' && form.elements.pickupAccuracy) form.elements.pickupAccuracy.value = '';
  delete wrap.dataset.pinned; delete wrap.dataset.label;
  refreshRideCard(form);
}
function useMyLocation(btn){
  const wrap = btn.closest('[data-place]'), input = wrap.querySelector('input[name="pickup"]');
  const say = (m, ok) => placeStatus(wrap, m, ok);
  /* Location only works on a secure (https) website, and not inside some preview windows. Say so plainly instead of failing silently. */
  const framed = window.self !== window.top;
  const typeIt = () => { input.focus(); };
  if (!navigator.geolocation){ say("Your browser can't share your location. Please type the pickup place instead.", false); typeIt(); return; }
  if (window.isSecureContext === false){ say('Location only works on a secure (https) website. It will work once the site is online. For now, please type the pickup place.', false); typeIt(); return; }
  btn.disabled = true; say('Finding you...', true);
  navigator.geolocation.getCurrentPosition((pos) => {
    userPos = {lat:pos.coords.latitude, lng:pos.coords.longitude, acc:Math.round(pos.coords.accuracy), label:''};
    const typed = input.value.trim(), auto = !typed || typed === 'My current location' || wrap.dataset.pinned;
    setPlace(wrap, {lat:userPos.lat, lng:userPos.lng, acc:userPos.acc, source:'gps', label:auto ? 'My current location' : ''});
    btn.disabled = false;
    /* then try to turn the pin into a real place name; keep the pin if that fails or the person has typed meanwhile */
    geoReverse(userPos.lat, userPos.lng).then((name) => {
      userPos.label = name;
      if (name && auto && input.value === 'My current location' && wrap.dataset.pinned){ input.value = name; wrap.dataset.label = name; }
    }).catch(() => {});
  }, (err) => {
    btn.disabled = false;
    say(err.code === 1
        ? (framed ? 'This preview window blocks location. Open the site in its own tab, or on your own website address, to use it. For now, please type the pickup place.'
                  : 'Location is turned off for this site. Allow it in your browser settings, or type the pickup place.')
        : err.code === 3 ? 'That took too long. Try again, or type the pickup place.' : "We couldn't find you. Please type the pickup place.", false);
    typeIt();
  }, {enableHighAccuracy:true, timeout:15000, maximumAge:30000});
}
function prefillLocation(){
  if (!userPos) return;
  $$('form[data-kind="ride"], form[data-kind="delivery"]').forEach((f) => {
    const wrap = $('[data-place="pickup"]', f); if (!wrap || wrap.dataset.pinned) return;
    setPlace(wrap, {lat:userPos.lat, lng:userPos.lng, acc:userPos.acc, source:'gps', label:userPos.label || 'My current location'});
  });
}
