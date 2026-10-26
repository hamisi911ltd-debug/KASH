/* =========================================================
   KASH - js/data/legal.js
   Privacy policy, Terms & conditions, Cookies & storage.

   IMPORTANT: this is a DRAFT written from how this website actually works.
   It is not legal advice. Have a Kenyan lawyer review it before launch.
   Anything in [square brackets] is a decision only you can make - fill it in.
   Tokens: {email} {phone} {location} {hours} come from js/config.js.
========================================================= */
'use strict';

const LEGAL = {
  updated: '15 October 2026',
  retentionMonths: 12,       /* keep this in step with RETENTION_DAYS in backend/wrangler.toml (365 = 12 months) */

  privacy: {
    title: 'Privacy Policy',
    lead: 'How KASH General Suppliers collects, uses and protects your information.',
    sections: [
      {h:'1. Who we are', p:[
        'KASH General Suppliers ("KASH", "we", "us") runs this website and is responsible for the personal information you give us through it.',
        'Registered name and address: [add your registered business name and address].',
        'Contact: {email} · {phone} · {location}.']},
      {h:'2. What we collect', p:['We only collect what you choose to send us or what is needed to keep the site safe:'], ul:[
        'Your name and phone number, and your email if you give one.',
        'What you ask for: the service, places, dates, items, passenger numbers and any notes you type.',
        'Your location (coordinates), only if you press "Use my location". Your browser asks your permission first.',
        'If you ask to be connected to customer service in the chat: your name, phone number and the recent messages of that chat.',
        'For security: a scrambled (hashed) version of your internet address, used only to stop spam and abuse. We do not store your raw IP address.']},
      {h:'3. Why we use it', p:['We use your information to:'], ul:[
        'reply to you, give you quotes and confirm availability and prices;',
        'arrange the food order, transport, delivery, ride or stay you asked for;',
        'keep the website and our team safe from spam and misuse;',
        'meet our legal and accounting duties.'],
       after:'Our legal basis is your consent when you send a form, steps taken at your request before an agreement, our legitimate interest in running a secure service, and legal obligations.'},
      {h:'4. Who can see it', p:['Only our team members who need it to help you can see your requests. We do not sell personal information. We use these service providers:'], ul:[
        'Cloudflare: hosts the website, runs the server and stores requests in its database.',
        'OpenStreetMap: shows the maps on home pages and ride requests. Your browser contacts its servers when a map loads.',
        'Google Fonts: supplies the text fonts, so your browser contacts Google when a page loads.',
        'WhatsApp (Meta) and Google Maps: only if you click their buttons or links. Their own policies then apply.']},
      {h:'5. How long we keep it', p:['We delete requests after about {months} months, unless we must keep a record for longer for legal, accounting or dispute reasons. You can ask us to delete yours sooner.']},
      {h:'6. Your rights', p:['Under the Data Protection Act, 2019 of Kenya you can ask us to:'], ul:[
        'tell you what personal information we hold about you and give you a copy;',
        'correct anything that is wrong;',
        'delete your information or restrict how we use it;',
        'stop using it for a purpose you object to, and withdraw your consent at any time.'],
       after:'To use these rights, contact us at {email}. If you are not happy with our answer you can complain to the Office of the Data Protection Commissioner (ODPC) in Kenya.'},
      {h:'7. Keeping it safe', p:['The site uses HTTPS, requests are checked before they are stored, staff access is limited by role, and the system limits how fast anyone can send requests. No system is perfectly secure, so please do not send information you would not be comfortable sharing, such as passwords or card numbers.']},
      {h:'8. Where it is processed', p:['Our providers may process information on servers outside Kenya. We choose providers that protect information to a high standard. [Confirm and describe where your database is located.]']},
      {h:'9. Children', p:['Our services are for people aged 18 and over. We do not knowingly collect information about children.']},
      {h:'10. Changes', p:['If we change this policy we will update the date at the top of this page. Please check it from time to time.']},
    ]
  },

  terms: {
    title: 'Terms & Conditions',
    lead: 'The rules for using this website and requesting our services.',
    sections: [
      {h:'1. About these terms', p:['By using this website or sending us a request you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the site.']},
      {h:'2. Who can use our services', p:['You must be 18 or older to make a request or booking. If you are younger, a parent or guardian must make the request for you.']},
      {h:'3. Our services', p:['KASH offers four services: agro and food supply (chicken, beef, goat meat and eggs), transport and logistics, mobility and ride services (Uber-style cabs and tuk-tuks), and hospitality and Airbnb stays. What is available can change.']},
      {h:'4. Requests, quotes and bookings', ul:[
        'Sending a form is a request, not a confirmed booking or order.',
        'A request becomes confirmed only when we confirm it to you, by phone, WhatsApp or email.',
        'Prices shown on the site are a guide. We confirm the final price with you before you are charged.',
        'Food prices change with the market, so we confirm the current price in your quote.',
        'Availability, arrival times and distances shown are estimates, not guarantees.']},
      {h:'5. Food products', p:['We pack and deliver our products with care. Please check your order when it arrives and tell us within [add the time, for example 24 hours] if something is wrong.']},
      {h:'6. Transport and delivery', ul:[
        'Please give accurate pickup and drop-off details and describe what is being moved.',
        'We cannot carry illegal goods or goods that are dangerous. Tell us in advance about fragile, valuable or perishable items.',
        '[Add your terms on liability, insurance and compensation for loss or damage.]']},
      {h:'7. Rides', p:['Passengers must treat drivers and vehicles with respect and follow reasonable safety instructions. We may refuse or end a ride for safety reasons.']},
      {h:'8. Stays', ul:[
        'Check-in is from 2:00 PM and check-out by 11:00 AM unless we agree otherwise.',
        'A valid ID is required at check-in. No parties or events without our approval. Smoking is for outdoors only.',
        'The exact address is shared after your stay is confirmed. Please look after the home. You may be asked to cover damage you cause.']},
      {h:'9. Payments, cancellations and refunds', p:['[Add your payment methods, any deposit, and your cancellation and refund rules. Customers will rely on this section, so please complete it before launch.]']},
      {h:'10. Using the website properly', p:['Please do not misuse the site: no spam, no false requests, no attempts to break, overload or get into parts of the system you are not meant to use. We may block anyone who does.']},
      {h:'11. Our responsibility', p:['We take reasonable care in providing our services. To the extent the law allows, we are not responsible for losses we could not reasonably have foreseen, or for delays caused by events outside our control such as weather, traffic or road closures. Nothing in these terms limits any right you have that the law does not allow us to limit.']},
      {h:'12. Law', p:['These terms are governed by the laws of Kenya, and the courts of Kenya can hear any dispute.']},
      {h:'13. Changes and contact', p:['We may update these terms and will change the date above when we do. Questions: {email}.']},
    ]
  },

  cookies: {
    title: 'Cookies & storage',
    lead: 'What this website saves in your browser, and why.',
    sections: [
      {h:'Short version', p:['We do not use advertising or tracking cookies, and we do not run analytics on this site today.']},
      {h:'What we save in your browser', p:['These items stay on your device. They make the site work and are not used to follow you around:'], ul:[
        'Your quote list (so items you add are still there when you come back).',
        'Your day or night mode choice (for this visit).',
        'Your chat with the assistant (for this visit, so it does not restart when you change page).',
        'In demo mode only: copies of requests you send.'],
       after:'You can clear all of this at any time in your browser settings.'},
      {h:'Third parties', p:['Google Fonts (text fonts) and OpenStreetMap (maps) load from their own servers, so those companies can see your internet address when a page uses them. Links to WhatsApp and Google Maps only connect when you click them.']},
      {h:'If this changes', p:['If we add analytics or advertising in the future we will update this page and ask for your consent first.']},
    ]
  },
};
