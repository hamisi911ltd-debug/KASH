/* =========================================================
   KASH - js/data/content.js
   Shared wording: trust points, "why KASH", FAQs.
========================================================= */
/* ---------- Shared ---------- */
const TRUST = [
  {icon:'truck',  color:'var(--blue)',  title:'Reliable supply',    desc:'On time, every time.'},
  {icon:'shield', color:'var(--teal)',  title:'Quality products',   desc:'Only the best, always.'},
  {icon:'users',  color:'#c98f00',      title:'Customer focus',     desc:'Your needs, our priority.'},
  {icon:'growth', color:'var(--red)',   title:'Sustainable growth', desc:'Building a better tomorrow.'},
];
const WHY_KASH = [
  {icon:'check',  color:'teal',  title:'One partner, many solutions', desc:'Food, transport, rides and stays from one team you already trust.'},
  {icon:'clock',  color:'blue',  title:'Respect for your time',       desc:'Clear communication, honest timelines and no chasing.'},
  {icon:'shield', color:'amber', title:'Quality you can check',       desc:'A branded truck, clean homes and fresh, labelled meat and eggs.'},
  {icon:'users',  color:'red',   title:'Real people, real support',   desc:'Talk to a person who knows your order and fixes problems fast.'},
];

const FAQS = {
  general: [
    {q:'What does KASH General Suppliers do?', a:'We bring four services under one roof: agro and food supply, transport and logistics, mobility and ride services, and hospitality and Airbnb stays.'},
    {q:'How do I place a request?', a:'Use the quote form, the request buttons on each service page, or message us. We reply as soon as we can to confirm details and pricing.'},
    {q:'Do I pay when I send a request?', a:'No. Sending a request only tells us what you need. We confirm availability and the price with you before anything is charged.'},
  ],
  agro: [
    {q:'What do you sell?', a:'Right now we supply chicken, eggs, beef and goat meat. We plan to add more products over time.'},
    {q:'Can I order small quantities?', a:'Yes. We supply households as well as restaurants, hotels, butcheries and bulk buyers.'},
    {q:"What are today's prices?", a:'Meat and egg prices move with the market, so we confirm the current price in your quote.'},
    {q:'Do you deliver?', a:'Yes. Add your delivery place and preferred date to the quote form and we confirm what is possible.'},
  ],
  transport: [
    {q:'What can you carry?', a:'Bulk and heavy cargo on our truck. Tell us what you are moving and we confirm it fits.'},
    {q:'Can you handle regular deliveries?', a:'Yes. We can set up recurring runs for shops, farms and businesses. Mention it in your request.'},
    {q:'How is transport priced?', a:'By distance, load and vehicle. You get a clear price before the trip begins.'},
  ],
  mobility: [
    {q:'How do I book a ride?', a:'Tap Request a ride, tell us where from, where to and when. We confirm the vehicle and price.'},
    {q:'Can you do airport transfers?', a:'Yes. Share your flight time and we plan pickups so you arrive on time.'},
    {q:'What can I book?', a:'Uber-style cab rides and tuk-tuk rides.'},
  ],
  stays: [
    {q:'How does booking work?', a:'Send your dates and guests with Check availability. We confirm the home, the total price and how to reserve.'},
    {q:'Can I stay for a month or longer?', a:'Yes. Long stays are welcome and we can discuss flexible terms.'},
    {q:'What time is check-in?', a:'Standard check-in is from 2:00 PM and check-out by 11:00 AM. Earlier or later times can often be arranged.'},
  ],
};
