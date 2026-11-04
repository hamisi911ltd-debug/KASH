/* =========================================================
   KASH - js/core/geo.js
   Looking up places on the map (OpenStreetMap), so a pickup or
   drop-off can be pinned to exact coordinates, not just typed.
   If the lookup is unreachable the typed place is still sent as text.
========================================================= */
'use strict';

const GEO_URL = 'https://nominatim.openstreetmap.org';
/* "Westlands, Nairobi, Nairobi County, 00100, Kenya" -> "Westlands, Nairobi" */
function shortPlace(name){
  return String(name || '').split(', ').filter((p) => p && p !== 'Kenya' && !/^\d{4,5}$/.test(p) && !/ County$/.test(p)).slice(0, 4).join(', ');
}
async function geoSearch(text){
  const b = BASE(), box = [b.lng - 1.5, b.lat + 1.5, b.lng + 1.5, b.lat - 1.5].map((n) => n.toFixed(3)).join(',');
  const res = await fetch(GEO_URL + '/search?format=jsonv2&limit=5&countrycodes=ke&accept-language=en&viewbox=' + box + '&q=' + encodeURIComponent(text), {headers:{Accept:'application/json'}});
  if (!res.ok) throw new Error('Place search ' + res.status);
  const seen = new Set();
  return (await res.json()).map((r) => ({lat:+r.lat, lng:+r.lon, label:shortPlace(r.display_name)}))
    .filter((r) => r.label && isFinite(r.lat) && isFinite(r.lng) && !seen.has(r.label) && seen.add(r.label));
}
async function geoReverse(lat, lng){
  const res = await fetch(GEO_URL + '/reverse?format=jsonv2&zoom=18&accept-language=en&lat=' + lat + '&lon=' + lng, {headers:{Accept:'application/json'}});
  if (!res.ok) throw new Error('Place lookup ' + res.status);
  const r = await res.json();
  return shortPlace(r.display_name);
}
