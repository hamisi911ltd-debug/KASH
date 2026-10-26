/* =========================================================
   KASH - js/components/forms.js
   The enquiry form, success message and the availability pop-up.
========================================================= */
'use strict';

function enquiryForm({service='', extended=false, wrapId=''}={}){
  const opts = SERVICE_OPTIONS;
  const val = opts.indexOf(service) > -1 ? service : opts[0];
  const items = cart.length ? `<div class="note-box">${ico('info')}<span>Your quote list (${cartCount()} item${cartCount() > 1 ? 's' : ''}) will be sent with this request.</span></div>` : '';
  return `<div data-form-wrap ${wrapId ? 'id="' + wrapId + '"' : ''}><form class="form" data-kind="enquiry" novalidate>
    <div class="row">
      ${field({label:'Your name', name:'name', req:true, ac:'name', id:'q_name'})}
      ${field({label:'Phone number', name:'phone', type:'tel', req:true, ac:'tel', ph:'e.g. 0712 345 678', id:'q_phone'})}
    </div>
    ${extended ? field({label:'Email (optional)', name:'email', type:'email', ac:'email', id:'q_email'}) : ''}
    ${selectField({label:'What do you need?', name:'service', options:opts, value:val, id:'q_service'})}
    ${extended ? `<div class="row">${field({label:'Delivery or pickup place', name:'place', ph:'e.g. Westlands, Nairobi', id:'q_place'})}
      ${field({label:'Preferred date', name:'date', type:'date', attrs:'min="' + todayISO() + '"', id:'q_date'})}</div>` : ''}
    ${textArea({label:'Details', name:'msg', ph:'e.g. 50 trays of eggs delivered weekly, or a 5-tonne load from Mombasa to Kisumu'})}
    ${items}
    ${honeypot()}${consentNote()}<div class="notice" data-notice role="alert"></div>
    <div class="actions">
      <button class="btn btn-amber" type="submit">Send my request</button>
      <span class="alt">${B.whatsapp ? `or <a href="${waUrl('Hello KASH General Suppliers')}" target="_blank" rel="noopener">chat on WhatsApp</a>` : `or <a href="${mailUrl('Quote request')}">email us</a>`}</span>
    </div>
  </form></div>`;
}

function successHtml({title, text, summary, mode, subject}){
  const wa = waUrl(summary), mail = mailUrl(subject, summary);
  return `<div class="success"><div class="tick">${ico('check')}</div><h3>${title}</h3><p>${text}</p>
    <div class="actions">
      ${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${ico('whatsapp')} Also send on WhatsApp</a>` : `<a class="btn btn-navy" href="${mail}">${ico('mail')} Email a copy</a>`}
      <a class="btn btn-outline" href="#/" data-close>Back to home</a>
    </div>
    ${mode === 'demo' ? '<p style="margin-top:18px;font-size:.8rem">Demo mode: this request is saved in this browser only. Connect the database in js/config.js to receive requests.</p>' : ''}</div>`;
}

/* ---------- request + booking modals ---------- */
function bookingModal(p, pre={}){
  openModal(`<h3>Check availability</h3><p class="sub">${esc(p.name)} · ${esc(p.location)}</p>
    <form class="form" data-kind="booking" data-property="${p.id}" novalidate>
      <div class="row">${field({label:'Your name', name:'name', req:true, ac:'name', id:'b_name'})}${field({label:'Phone number', name:'phone', type:'tel', req:true, ac:'tel', ph:'e.g. 0712 345 678', id:'b_phone'})}</div>
      <div class="row">${field({label:'Check in', name:'checkin', type:'date', req:true, value:pre.checkin || '', attrs:'min="' + todayISO() + '"', id:'b_in'})}
        ${field({label:'Check out', name:'checkout', type:'date', req:true, value:pre.checkout || '', attrs:'min="' + todayISO() + '"', id:'b_out'})}</div>
      ${field({label:'Guests (up to ' + p.guests + ')', name:'guests', type:'number', value:pre.guests || '1', attrs:'min="1" max="' + p.guests + '"', id:'b_guests'})}
      ${textArea({label:'Anything we should know?', name:'details', rows:2})}
      ${honeypot()}${consentNote()}<div class="notice" data-notice role="alert"></div>
      <button class="btn btn-amber btn-block" type="submit">Check availability</button>
    </form>`);
}
