/* =========================================================
   KASH - js/components/delivery.js
   The animated delivery scene and the "Fast. Safe. Reliable." section.
========================================================= */
'use strict';

/* ---------- Delivery advert (Fast. Safe. Reliable.) ---------- */
function deliveryStage(){
  return `<div class="dstage" role="img" aria-label="Animation: a KASH rider picks up a parcel, rides across the city, then hands a KASH bag to a customer at the door">
    <div class="scene city"><img src="images/fallback/delivery-city.png" alt="" loading="lazy"><div class="lines"></div></div>
    <div class="scene door"><img src="images/fallback/delivery-doorstep.png" alt="" loading="lazy">
      <div class="ring"></div><div class="bagtag"><img src="images/logo.svg" alt="">Your KASH order</div><div class="stamp">${ico('check')} Delivered</div></div>
    <div class="whoosh"></div>
    <div class="dstat"><span class="a">Picked up</span><span class="b">On the way</span><span class="c">Delivered with care</span></div>
    <div class="dtrack"><span class="dbike">${ico('bike')}</span></div></div>`;
}
function deliveryAd(){
  return `<section class="section ad" id="delivery" aria-label="KASH delivery"><div class="wrap">
    <div class="ad-head"><div><div class="eyebrow">Delivery</div>
      <h2><span class="b1">Fast.</span> <span class="b2">Safe.</span> <span class="b3">Reliable.</span></h2>
      <p>From a parcel at your door to a rush across the city, our branded riders get it there with care, and you know the price before we ride.</p></div>
      <div class="ad-btns"><a class="btn btn-amber" href="#/quote/delivery">Request a delivery</a>
        ${B.whatsapp ? `<a class="btn btn-ghost" href="${waUrl('Hello KASH, I need a delivery')}" target="_blank" rel="noopener">${ico('whatsapp')} WhatsApp us</a>` : `<a class="btn btn-ghost" href="#/contact">Talk to us</a>`}</div></div>
    <div class="ad-stagegrid">${deliveryStage()}
      <div class="ad-pills">
        <div class="ad-pill"><div class="badge c-blue">${ico('clock')}</div><div><b>Fast</b><span>Quick dispatch for city runs.</span></div></div>
        <div class="ad-pill"><div class="badge c-teal">${ico('shield')}</div><div><b>Safe</b><span>Handled with care, door to door.</span></div></div>
        <div class="ad-pill"><div class="badge c-red">${ico('check')}</div><div><b>Reliable</b><span>Confirmed price, honest timing.</span></div></div>
      </div></div></div></section>`;
}
