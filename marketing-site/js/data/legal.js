/* =========================================================
   KASH - js/data/legal.js
   Privacy policy, Terms & conditions, Cookies & storage.

   Written from how this website actually works. Have a Kenyan lawyer
   review it from time to time, and bump `updated` whenever it changes.
   Tokens: {email} {phone} {location} {hours} {months} come from js/config.js.
========================================================= */
'use strict';

const LEGAL = {
  updated: '3 November 2026',
  retentionMonths: 12,       /* keep this in step with RETENTION_DAYS in backend/wrangler.toml (365 = 12 months) */

  privacy: {
    title: 'Privacy Policy',
    lead: 'How KASH General Suppliers collects, uses and protects your information.',
    sections: [
      {h:'1. Who we are', p:[
        'KASH General Suppliers ("KASH", "we", "us") is a registered Kenyan company with over a decade of experience in agriculture and food, transport and logistics, and hospitality and accommodation. We run this website and are responsible for the personal information you give us through it.',
        'Contact us at {email}, {phone}, {location}. Our hours are {hours}.']},
      {h:'2. What we collect', p:['We only collect what you choose to send us or what is needed to keep the site safe:'], ul:[
        'Your name and phone number, and your email if you give one.',
        'What you ask for: the service, places, dates, items, passenger numbers and any notes you type.',
        'The pickup, drop-off or delivery places you type. To show them on a map we send that text to OpenStreetMap.',
        'Your location (coordinates), only if you press "Use my location". Your browser asks your permission first.',
        'If you ask to be connected to customer service in the chat: your name, phone number and the recent messages of that chat.',
        'If you leave a review: your name and what you write.',
        'For security: a scrambled (hashed) version of your internet address, used only to stop spam and abuse. We do not store your raw IP address.']},
      {h:'3. Why we use it', p:['We use your information to:'], ul:[
        'reply to you, give you quotes and confirm availability and prices;',
        'arrange the food order, transport, delivery, ride or stay you asked for;',
        'keep the website and our team safe from spam and misuse;',
        'meet our legal and accounting duties.'],
       after:'Our legal basis is your consent when you send a form, steps taken at your request before an agreement, our legitimate interest in running a secure service, and legal obligations.'},
      {h:'4. Who can see it', p:['Only our team members who need it to help you can see your requests. We do not sell personal information. We use these service providers:'], ul:[
        'Cloudflare: hosts the website, runs the server, stores requests in its database, protects forms with a human check, and measures overall visits without cookies.',
        'OpenStreetMap: shows the maps and finds places you type. Your browser or our site contacts its servers when a map loads or a place is searched.',
        'Google Fonts: supplies the text fonts, so your browser contacts Google when a page loads.',
        'WhatsApp (Meta) and Google Maps: only if you click their buttons or links. Their own policies then apply.']},
      {h:'5. How long we keep it', p:['We delete requests after about {months} months, unless we must keep a record for longer for legal, accounting or dispute reasons. You can ask us to delete yours sooner.']},
      {h:'6. Your rights', p:['Under the Data Protection Act, 2019 of Kenya you can ask us to:'], ul:[
        'tell you what personal information we hold about you and give you a copy;',
        'correct anything that is wrong;',
        'delete your information or restrict how we use it;',
        'stop using it for a purpose you object to, and withdraw your consent at any time.'],
       after:'To use these rights, contact us at {email}. We aim to reply within 30 days. If you are not happy with our answer you can complain to the Office of the Data Protection Commissioner (ODPC) in Kenya.'},
      {h:'7. Keeping it safe', p:['The site uses HTTPS, requests are checked before they are stored, staff access is limited by role, passwords are stored only as scrambled hashes, and the system limits how fast anyone can send requests. No system is perfectly secure, so please do not send us card numbers or ID documents through the forms.']},
      {h:'8. Where it is processed', p:['Our providers may process information on servers outside Kenya. We choose providers that protect information to a high standard, and we share only what is needed to run the service.']},
      {h:'9. Children', p:['Our services are for people aged 18 and over. We do not knowingly collect information about children.']},
      {h:'10. Changes', p:['If we change this policy we will update the date at the top of this page. Please check it from time to time.']},
    ]
  },

  terms: {
    title: 'Terms & Conditions',
    lead: 'The rules for using this website and requesting KASH General Suppliers services.',
    sections: [
      {h:'1. About these terms', p:['By using this website or sending us a request you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the site. These terms are between you and KASH General Suppliers, Nairobi, Kenya.']},
      {h:'2. Who can use our services', p:['You must be 18 or older to make a request or booking. If you are younger, a parent or guardian must make the request for you.']},
      {h:'3. Our services', p:['KASH operates in three sectors: agriculture and food, transport and logistics (including container trucking, delivery, cabs and tuk-tuks), and hospitality and accommodation. What is available can change.']},
      {h:'4. Requests, quotes and bookings', ul:[
        'Sending a form is a request, not a confirmed booking or order.',
        'A request becomes confirmed only when we confirm it to you, by phone, WhatsApp or email.',
        'Prices shown on the site are a guide. We confirm the final price with you before you are charged.',
        'The container trucking rate card is shown in Kenya shillings before 16% VAT. VAT is added on the invoice.',
        'Food prices change with the market, so we confirm the current price in your quote.',
        'Availability, arrival times and distances shown are estimates, not guarantees.']},
      {h:'5. Food products', p:['We pack and deliver our products with care. Please check your order when it arrives and tell us within 24 hours if something is wrong, so we can put it right.']},
      {h:'6. Transport and delivery', ul:[
        'Please give accurate pickup and drop-off details and describe what is being moved.',
        'We cannot carry illegal goods or goods that are dangerous. Tell us in advance about fragile, valuable or perishable items.',
        'Container trucking is charged at the rate agreed in your quote for the route and depot. Waiting time, extra stops and changes to the route may be charged separately, and we tell you before we do.',
        'Please report any loss or damage to us as soon as possible, and always within 48 hours of delivery, with the details of what happened.']},
      {h:'7. Rides', p:['Passengers must treat drivers and vehicles with respect and follow reasonable safety instructions. We may refuse or end a ride for safety reasons.']},
      {h:'8. Stays', ul:[
        'Check-in is from 2:00 PM and check-out by 11:00 AM unless we agree otherwise.',
        'A valid ID is required at check-in. No parties or events without our approval. Smoking is for outdoors only.',
        'The exact address is shared after your stay is confirmed. Please look after the home. You may be asked to cover damage you cause.']},
      {h:'9. Payments, cancellations and refunds', ul:[
        'We confirm how to pay in your quote or booking confirmation. Payment may be by M-Pesa, cash or another method we agree with you.',
        'A deposit may be asked for before a stay or a large order. We tell you the amount before you pay.',
        'Please tell us as early as you can if you need to cancel or change a booking. Cancellation terms for each service are confirmed with your booking.',
        'Where we agree to a refund, we pay it back to the way you paid, within a reasonable time.']},
      {h:'10. Using the website properly', p:['Please do not misuse the site: no spam, no false requests, no attempts to break, overload or get into parts of the system you are not meant to use. We may block anyone who does.']},
      {h:'11. Our responsibility', p:['We take reasonable care in providing our services. To the extent the law allows, we are not responsible for losses we could not reasonably have foreseen, or for delays caused by events outside our control such as weather, traffic or road closures. Nothing in these terms limits any right you have that the law does not allow us to limit.']},
      {h:'12. Law', p:['These terms are governed by the laws of Kenya, and the courts of Kenya can hear any dispute.']},
      {h:'13. Changes and contact', p:['We may update these terms and will change the date above when we do. Questions: {email} or {phone}.']},
    ]
  },

  cookies: {
    title: 'Cookies & storage',
    lead: 'What this website saves in your browser, and why.',
    sections: [
      {h:'Short version', p:['We do not use advertising or tracking cookies, and we do not build profiles of visitors. We measure overall visits with Cloudflare Web Analytics, which works without cookies and does not follow you from site to site.']},
      {h:'What we save in your browser', p:['These items stay on your device. They make the site work and are not used to follow you around:'], ul:[
        'Your quote list (so items you add are still there when you come back).',
        'Your day or night mode choice.',
        'Your chat with the assistant (for this visit, so it does not restart when you change page).',
        'If you create a KASH account: a sign-in token, so you stay signed in until you sign out.',
        'In demo mode only: copies of requests you send.'],
       after:'You can clear all of this at any time in your browser settings.'},
      {h:'Third parties', p:['Google Fonts (text fonts) and OpenStreetMap (maps) load from their own servers, so those companies can see your internet address when a page uses them. Cloudflare protects forms with a human check and counts visits. Links to WhatsApp and Google Maps only connect when you click them.']},
      {h:'If this changes', p:['If we add advertising or tracking in the future we will update this page and ask for your consent first.']},
    ]
  },
};
