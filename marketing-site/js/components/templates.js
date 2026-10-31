/* =========================================================
   KASH - js/components/templates.js
   Reusable HTML pieces: fields, tiles, steps, hero, cards.
========================================================= */
'use strict';

function field({label, name, type='text', req=false, ph='', hint='', value='', ac='', attrs='', id}){
  const fid = id || ('f_' + name);
  return `<div class="field"><label for="${fid}">${label}${req ? ' <span class="req">*</span>' : ''}</label>
    <input id="${fid}" name="${name}" type="${type}" ${req ? 'required' : ''} placeholder="${esc(ph)}" value="${esc(value)}" ${ac ? 'autocomplete="' + ac + '"' : ''} ${attrs}>
    ${hint ? `<span class="hint">${hint}</span>` : ''}<span class="err">${req ? 'This field is required.' : ''}</span></div>`;
}
function selectField({label, name, options, value='', id}){
  const fid = id || ('f_' + name);
  return `<div class="field"><label for="${fid}">${label}</label><select id="${fid}" name="${name}">
    ${options.map((o) => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
}
function textArea({label, name, ph='', value='', rows=4, req=false}){
  return `<div class="field"><label for="f_${name}">${label}${req ? ' <span class="req">*</span>' : ''}</label>
    <textarea id="f_${name}" name="${name}" rows="${rows}" ${req ? 'required' : ''} placeholder="${esc(ph)}">${esc(value)}</textarea><span class="err">This field is required.</span></div>`;
}
function contactList(){
  const phone = telUrl() ? `<a href="${telUrl()}">${esc(B.phoneDisplay)}</a>` : esc(B.phoneDisplay || '');
  return `<ul class="contact-list">
    <li><div class="badge c-blue">${ico('phone')}</div><div><b>${phone}</b><span>${esc(B.hours || '')}</span></div></li>
    <li><div class="badge" style="background:#1fa855">${ico('whatsapp')}</div><div><b>${B.whatsapp ? `<a href="${waUrl('Hello KASH General Suppliers')}" target="_blank" rel="noopener noreferrer">WhatsApp us</a>` : 'WhatsApp not set up yet'}</b><span>Quick enquiries</span></div></li>
    <li><div class="badge c-red">${ico('mail')}</div><div><b><a href="mailto:${esc(B.email)}">${esc(B.email)}</a></b><span>We're here for you</span></div></li>
    <li><div class="badge c-amber">${ico('pin')}</div><div><b><a href="${locationUrl()}" target="_blank" rel="noopener noreferrer">${esc(B.location)}</a></b><span>Tap to open in maps</span></div></li>
  </ul>`;
}
function featTiles(list, cols='g4'){
  return `<div class="grid ${cols}">${list.map((f, i) => {
    const c = f.color || ['blue','teal','amber','red'][i % 4];
    return `<div class="feat"><div class="badge ${COLOR[c] || c}">${ico(f.icon)}</div><h3>${f.title}</h3><p>${f.desc}</p></div>`;
  }).join('')}</div>`;
}
function steps(list){ return `<div class="steps">${list.map((s) => `<div class="step"><h3>${s.title}</h3><p>${s.desc}</p></div>`).join('')}</div>`; }
function checks(list){ return `<ul class="checks">${list.map((t) => `<li>${ico('check')}<span>${t}</span></li>`).join('')}</ul>`; }
/* the three business sectors from the company profile, each with its full list of services */
function sectorCards(){
  return `<div class="grid g3">${COMPANY.sectors.map((s) => `<article class="feat sector"><div class="badge ${COLOR[s.color]}">${ico(s.icon)}</div><h3>${s.title}</h3><p>${s.intro}</p>${checks(s.items)}<p>${s.close}</p><a class="go" href="#/${s.route}">Explore ${s.title.toLowerCase()}</a></article>`).join('')}</div>`;
}
function faq(list){ return `<div class="faq">${list.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</div>`; }
function trust(){ return `<div class="trust">${TRUST.map((t) => `<div><span style="color:${t.color}">${ico(t.icon)}</span><b>${t.title}</b><span>${t.desc}</span></div>`).join('')}</div>`; }
function secHead(title, lede='', eyebrow='', link=''){
  return `<div class="section-head"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h2>${title}</h2>${lede ? `<p class="lede">${lede}</p>` : ''}</div>${link}</div>`;
}
function ctaBand(title, text, btnLabel, href, accent){
  return `<div class="cta-band"><div><h2>${title}</h2><p>${text}</p></div><a class="btn btn-amber" href="${href}">${btnLabel}</a></div>`;
}
function brandBar(){ return '<div class="brandbar" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'; }

function heroPage({accent='blue', crumbs=[], title, lead='', actions='', card=''}){
  const trail = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a>${crumbs.map(([l, h]) => (h ? `<a href="${h}">${l}</a>` : `<span>${l}</span>`)).join('')}</nav>`;
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  const backHref = parent && parent[1] ? parent[1] : '#/';
  const backLabel = parent ? parent[0] : 'Home';
  return `<section class="page-hero acc-${accent} ${card ? '' : 'no-card'}"><div class="ph-grid"><div><a class="page-back" href="${backHref}"><span>Back to ${backLabel}</span></a>${crumbs.length ? trail : ''}<h1>${title}</h1>
    ${lead ? `<p class="lead">${lead}</p>` : ''}${actions ? `<div class="hero-actions">${actions}</div>` : ''}</div>${card ? `<div>${card}</div>` : ''}</div>${HERO_RIBBON}</section>`;
}
function photoCard(img, alt, strip=false, pos=''){ return `<div class="hero-card ${strip ? 'strip' : ''}"><img src="${imgSrc(img)}" alt="${esc(alt)}" ${pos ? 'style="object-position:' + pos + '"' : ''}>${brandBar()}</div>`; }
function slideCard(list, {strip=false}={}){
  if (!list || !list.length) return '';
  if (list.length === 1) return photoCard(list[0].img, list[0].alt || '', strip, list[0].pos || '');
  return `<div class="hero-card show ${strip ? 'strip' : ''}" data-show>${list.map((s, i) => `<img class="sl ${i === 0 ? 'on' : ''}" src="${imgSrc(s.img)}" alt="${esc(s.alt || '')}" ${s.pos ? 'style="object-position:' + s.pos + '"' : ''} ${i ? 'loading="lazy"' : ''}>`).join('')}
    <div class="dots">${list.map((s, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" aria-label="Show photo ${i + 1}"></button>`).join('')}</div>${brandBar()}</div>`;
}
function glyphCard(icon){ return `<div class="hero-card"><div class="glyph-panel">${ico(icon)}</div>${brandBar()}</div>`; }

/* media block used by vehicle / property / product cards */
function media({img, alt='', icon, tag='', state='', stateOn=true, accent='blue', pos=''}){
  return `<div class="media acc-${accent}">${img ? `<img src="${imgSrc(img)}" alt="${esc(alt)}" loading="lazy" ${pos ? 'style="object-position:' + pos + '"' : ''}>` : `<div class="glyph-panel">${ico(icon)}</div>`}
    ${tag ? `<span class="tagchip">${tag}</span>` : ''}${state ? `<span class="state ${stateOn ? '' : 'off'}">${state}</span>` : ''}<div class="bar"></div></div>`;
}

/* Anti-spam trap: people never see this box, bots fill it in. The server quietly drops any request where it is filled. */
const honeypot = () => '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>';
/* One line under every form: tells people what happens to their details. */
const consentNote = () => '<p class="consent">By sending this you agree to our <a href="#/privacy">Privacy Policy</a>.</p>';

/* ---------- where we are, and our social media ---------- */
/* Your own Google Maps link if you set one in config.js, otherwise a search for the place name. Always opens a real map. */
const locationUrl = () => /^https:\/\//i.test(B.mapUrl || '') ? B.mapUrl : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(B.location || 'Nairobi, Kenya');

const SOCIAL_NETWORKS = [
  ['facebook', 'Facebook', /^(?:www\.)?facebook\.com$/i, 'https://www.facebook.com/'],
  ['instagram', 'Instagram', /^(?:www\.)?instagram\.com$/i, 'https://www.instagram.com/'],
  ['x', 'X', /^(?:www\.)?(?:x\.com|twitter\.com)$/i, 'https://x.com/'],
  ['youtube', 'YouTube', /^(?:(?:www|m)\.)?youtube\.com$|^youtu\.be$/i, 'https://www.youtube.com/'],
  ['linkedin', 'LinkedIn', /^(?:www\.)?linkedin\.com$/i, 'https://www.linkedin.com/']
];
function socialLinks(){
  const s = (window.KASH_CONFIG && window.KASH_CONFIG.social) || {};
  const links = SOCIAL_NETWORKS.map(([key, name, allowedHost, platformUrl]) => {
    const configured = (s[key] || '').trim();
    if (!configured) return {key, name, url:platformUrl, action:'platform'};
    let profile;
    try { profile = new URL(configured); }
    catch (error){
      console.error(`Invalid ${name} profile URL in js/config.js.`, error);
      return {key, name, url:platformUrl, action:'platform'};
    }
    if (profile.protocol !== 'https:' || !allowedHost.test(profile.hostname)){
      console.error(`The ${name} profile must be an HTTPS URL on its official domain.`);
      return {key, name, url:platformUrl, action:'platform'};
    }
    return {key, name, url:profile.href, action:'profile'};
  });
  const message = 'Discover KASH General Suppliers: ' + window.location.href;
  links.push({
    key:'whatsapp',
    name:'WhatsApp',
    url:'https://wa.me/?text=' + encodeURIComponent(message),
    action:'share'
  });
  return links;
}
const socialAnchors = (list) => list.map((l) =>
  `<a href="${esc(l.url)}" data-network="${l.key}" target="_blank" rel="noopener noreferrer" aria-label="${l.action === 'profile' ? 'KASH on ' + l.name : l.action === 'share' ? 'Share KASH on ' + l.name : 'Open ' + l.name + ' (KASH profile coming soon)'} (opens in a new tab)" title="${l.action === 'profile' ? 'KASH on ' + l.name : l.action === 'share' ? 'Share KASH on ' + l.name : l.name + ' — KASH profile coming soon'}">${ICONS[l.key] || ICONS.whatsappLogo}</a>`).join('');
const socialPanel = () => {
  const links = socialLinks();
  return links.length ? `<div class="panel mt-22"><h3 style="font-weight:800;font-size:1.2rem">Follow KASH</h3><div class="socials socials-row">${socialAnchors(links)}</div></div>` : '';
};
