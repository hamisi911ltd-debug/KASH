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
function rideLiveHtml(mode){
  const name = mode === 'tuktuk' ? 'tuk-tuk' : 'cab';
  if (!userPos) return `<div class="live-empty">${ico('locate')}<b>See the nearest ${name}</b><p>Tap “Use my location” and we'll show how far our ${name} is from you.</p></div>`;
  const base = BASE(), km = distKm(base, userPos), mins = Math.max(2, Math.round(km * 1.35 / RIDE_SPEED[mode] * 60));
  const padLat = Math.max(0.008, Math.abs(base.lat - userPos.lat) * 0.35), padLng = Math.max(0.008, Math.abs(base.lng - userPos.lng) * 0.35);
  const src = osmEmbed(Math.min(base.lng, userPos.lng) - padLng, Math.min(base.lat, userPos.lat) - padLat, Math.max(base.lng, userPos.lng) + padLng, Math.max(base.lat, userPos.lat) + padLat, userPos.lat, userPos.lng);
  const far = km > 80;
  const path = 'M70 86 C 190 18, 330 126, 530 52';
  return `<div class="live">
    <div class="live-stats"><div><b>${km < 10 ? km.toFixed(1) : Math.round(km)} km</b><span>${esc(base.label)} to you</span></div>
      <div><b>${far ? 'Call us' : '~' + mins + ' min'}</b><span>${far ? 'You are far from our base' : 'estimated arrival'}</span></div></div>
    <div class="route"><svg viewBox="0 0 600 130" role="img" aria-label="A ${name} driving from KASH to your location">
      <path class="rpath" d="${path}"/>
      <circle cx="70" cy="86" r="13" fill="#0a1f3d"/><text x="70" y="91" text-anchor="middle" fill="#fff" font-size="13" font-weight="800">K</text>
      <text x="70" y="116" text-anchor="middle" class="rlbl">KASH</text>
      <g transform="translate(530 52)"><path d="M0 -24 c-10 0 -16 7 -16 15 c0 11 16 26 16 26 s16 -15 16 -26 c0 -8 -6 -15 -16 -15z" fill="#e01b34"/><circle cy="-9" r="6" fill="#fff"/></g>
      <text x="530" y="90" text-anchor="middle" class="rlbl">You</text>
      <g><animateMotion dur="5s" repeatCount="indefinite" path="${path}" rotate="0"/>
        <circle r="17" fill="#ffb51a"/><rect x="-9" y="-6" width="18" height="9" rx="3" fill="#0a1f3d"/><circle cx="-5" cy="5" r="2.6" fill="#0a1f3d"/><circle cx="5" cy="5" r="2.6" fill="#0a1f3d"/></g>
    </svg></div>
    ${mapBox(src, 'Your location')}
    <div class="map-actions"><a class="btn btn-outline btn-sm" href="${gmapDir(base, userPos)}" target="_blank" rel="noopener">${ico('pin')} Route on Google Maps</a></div>
    <p class="muted small" style="margin-top:10px">This is an estimate from ${esc(base.label)}. Live driver tracking will show here once our vehicles carry GPS.</p></div>`;
}
function useMyLocation(btn){
  const form = btn.closest('form'), st = $('[data-locate-status]', form);
  const say = (m, ok) => { st.textContent = m; st.className = 'locate-status show ' + (ok ? 'ok' : 'bad'); };
  /* Location only works on a secure (https) website, and not inside some preview windows. Say so plainly instead of failing silently. */
  const framed = window.self !== window.top;
  const typeIt = () => { form.elements.pickup.focus(); };
  if (!navigator.geolocation){ say("Your browser can't share your location. Please type the pickup place instead.", false); typeIt(); return; }
  if (window.isSecureContext === false){ say('Location only works on a secure (https) website. It will work once the site is online. For now, please type the pickup place.', false); typeIt(); return; }
  btn.disabled = true; say('Finding you...', true);
  navigator.geolocation.getCurrentPosition((pos) => {
    userPos = {lat:pos.coords.latitude, lng:pos.coords.longitude, acc:Math.round(pos.coords.accuracy)};
    form.elements.lat.value = userPos.lat.toFixed(6); form.elements.lng.value = userPos.lng.toFixed(6);
    if (!form.elements.pickup.value.trim()) form.elements.pickup.value = 'My current location';
    form.elements.pickup.closest('.field').classList.remove('invalid');
    say('Location found (accurate to about ' + userPos.acc + ' m).', true);
    btn.disabled = false;
    const live = $('#rideLive'); if (live) live.innerHTML = rideLiveHtml(form.dataset.mode);
  }, (err) => {
    btn.disabled = false;
    say(err.code === 1
        ? (framed ? 'This preview window blocks location. Open the site in its own tab, or on your own website address, to use it. For now, please type the pickup place.'
                  : 'Location is turned off for this site. Allow it in your browser settings, or type the pickup place.')
        : err.code === 3 ? 'That took too long. Try again, or type the pickup place.' : "We couldn't find you. Please type the pickup place.", false);
    typeIt();
  }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
}
function prefillLocation(){
  if (!userPos) return;
  $$('form[data-kind="ride"], form[data-kind="delivery"]').forEach((f) => {
    f.elements.lat.value = userPos.lat.toFixed(6); f.elements.lng.value = userPos.lng.toFixed(6);
    if (!f.elements.pickup.value.trim()) f.elements.pickup.value = 'My current location';
    const st = $('[data-locate-status]', f); if (st){ st.textContent = 'Location found (accurate to about ' + userPos.acc + ' m).'; st.className = 'locate-status show ok'; }
  });
}
