/* =========================================================
   KASH - js/data/content.js
   Shared wording: trust points, the company profile, FAQs.
========================================================= */
/* ---------- Shared ---------- */
const TRUST = [
  {icon:'truck',  color:'var(--blue)',  title:'Reliable supply',    desc:'On time, every time.'},
  {icon:'shield', color:'var(--teal)',  title:'Quality products',   desc:'Only the best, always.'},
  {icon:'users',  color:'#c98f00',      title:'Customer focus',     desc:'Your needs, our priority.'},
  {icon:'growth', color:'var(--red)',   title:'Sustainable growth', desc:'Building a better tomorrow.'},
];

/* ---------- The company profile (official wording, shown on About, Home and Services) ---------- */
const COMPANY = {
  tagline: 'Delivering quality goods and services across Kenya.',
  partner: 'Your reliable partner in agriculture and food, transport and logistics, and hospitality and accommodation.',
  promise: 'Serving Kenya with quality, reliability and excellence.',
  intro: [
    'KASH General Suppliers is a registered Kenyan company with over a decade of experience in providing quality goods and services to individuals, businesses, institutions and organizations across Kenya.',
    'Established with a commitment to excellence, reliability and customer satisfaction, KASH General Suppliers has built its operations around understanding the diverse needs of its clients and delivering practical, affordable and efficient solutions.',
    'Over the years, the company has developed experience in general supplies, service delivery and business support, positioning itself as a dependable partner for clients seeking quality products and professional services.',
    "KASH General Suppliers operates in three main sectors: Agriculture and Food, Transport and Logistics, and Hospitality and Accommodation. Through these sectors, the company seeks to provide integrated solutions that meet the changing needs of Kenya's growing economy.",
    'With a nationwide service outlook, KASH General Suppliers provides goods and services across Kenya, serving clients in both urban and rural areas.',
  ],
  vision: 'To become a leading and trusted Kenyan company in the provision of quality goods and services through innovation, efficiency, reliability and customer satisfaction.',
  mission: 'To provide affordable, reliable and high-quality goods and services across Kenya while maintaining professionalism, integrity and excellence in all our business operations.',
  valuesShort: 'Integrity, quality, reliability, customer satisfaction, professionalism and innovation.',
  values: [
    {icon:'shield', title:'Integrity',             desc:'We uphold honesty, transparency and ethical business practices in all our engagements.'},
    {icon:'star',   title:'Quality',               desc:"We are committed to providing goods and services that meet our clients' expectations and applicable industry standards."},
    {icon:'clock',  title:'Reliability',           desc:'We strive to deliver consistently, efficiently and within agreed timelines.'},
    {icon:'heart',  title:'Customer satisfaction', desc:'We place our clients at the centre of our operations, ensuring that their needs and expectations guide our service delivery.'},
    {icon:'users',  title:'Professionalism',       desc:'We maintain high standards of competence, accountability and respect in all our business relationships.'},
    {icon:'growth', title:'Innovation',            desc:'We continuously seek practical and efficient ways of improving our products, services and operations.'},
  ],
  sectors: [
    {title:'Agriculture and food', route:'agro', color:'teal', icon:'leaf',
      intro:'KASH General Suppliers provides agricultural and food-related supplies to meet the needs of households, businesses, institutions and organizations throughout Kenya.',
      items:['Supply of agricultural produce, including cereals, grains, vegetables, fruits and other farm products.',
        'Supply and distribution of dry foodstuffs and fresh food products.',
        'Provision of food supplies to schools, hospitals, hotels, offices and other institutions.',
        'Sourcing and distribution of agricultural inputs and related products.',
        'Bulk food procurement, packaging and delivery.',
        'General agricultural commodities and food supply services.'],
      close:'Through this sector, KASH General Suppliers seeks to contribute to food security, strengthen agricultural value chains and support the livelihoods of Kenyan farmers and communities.'},
    {title:'Transport and logistics', route:'transport', color:'blue', icon:'truck',
      intro:'KASH General Suppliers provides transport and logistics solutions designed to facilitate the efficient movement of goods, supplies and people across Kenya.',
      items:['Transportation and distribution of goods and commodities.',
        'General cargo transportation and delivery services.',
        'Logistics coordination and supply chain support.',
        'Transportation services for businesses, institutions and organizations.',
        'Procurement, collection and delivery of goods.',
        'Transport arrangements for corporate and institutional activities.',
        'General logistical support for projects, events and business operations.'],
      close:'The company emphasizes efficiency, safety, reliability and timely delivery, recognizing that effective transport and logistics are essential to successful business operations.'},
    {title:'Hospitality and accommodation', route:'properties', color:'red', icon:'bed',
      intro:'KASH General Suppliers provides hospitality and accommodation-related services to individuals, corporate clients, institutions and organizations operating across Kenya.',
      items:['Hotel and accommodation booking and coordination.',
        'Accommodation arrangements for business and institutional travel.',
        'Conference, workshop and meeting venue arrangements.',
        'Catering and hospitality support services.',
        'Event hospitality coordination and logistical support.',
        'Accommodation and related services for corporate retreats, seminars and training programmes.',
        'General hospitality supplies and services.'],
      close:'Through this sector, KASH General Suppliers aims to ensure that clients enjoy convenient, comfortable and professionally coordinated hospitality and accommodation services suited to their needs and budgets.'},
  ],
  coverage: [
    'KASH General Suppliers provides goods and services across Kenya, with the capacity to coordinate supplies and service delivery to clients in different counties and regions.',
    'Our nationwide approach enables us to respond to diverse customer requirements, whether involving agricultural and food supplies, transport and logistics arrangements, or hospitality and accommodation services.',
    'We are committed to serving clients irrespective of their geographical location, subject to agreed service requirements and operational arrangements.',
  ],
  clients: ['National and county government institutions.', 'Private companies and business enterprises.', 'Non-governmental organizations and civil society institutions.', 'Educational and healthcare institutions.', 'Hotels, restaurants and hospitality establishments.', 'Community organizations and development projects.', 'Individual customers and households.'],
  clientsNote: 'Our approach is guided by the understanding that every client has unique needs requiring flexible, responsive and cost-effective solutions.',
  why: [
    {icon:'calendar', title:'Over a decade of experience', desc:'Our more than ten years of experience in serving the Kenyan market provide a strong foundation for understanding client needs and delivering practical business solutions.'},
    {icon:'box',      title:'Diversified services',        desc:'Our three principal business sectors enable clients to access multiple goods and services through one company.'},
    {icon:'pin',      title:'Nationwide coverage',         desc:'We provide goods and services across Kenya, offering clients convenience and coordinated service delivery.'},
    {icon:'star',     title:'Commitment to quality',       desc:'We prioritize quality products, dependable services and professional customer engagement.'},
    {icon:'bag',      title:'Competitive pricing',         desc:'We seek to provide cost-effective solutions without compromising on quality and service standards.'},
    {icon:'heart',    title:'Customer-centred approach',   desc:'We believe in building lasting business relationships through trust, responsiveness and consistent service delivery.'},
  ],
  commitment: [
    'At KASH General Suppliers, we believe that successful business relationships are built on trust, quality, accountability and the consistent delivery of value.',
    'Our commitment is to continue strengthening our operations, expanding our service capabilities and responding to the evolving needs of our clients across Kenya.',
    'As a proudly Kenyan company with over a decade of experience, we remain dedicated to supporting businesses, institutions, communities and individuals through dependable supplies and professional services.',
  ],
};

const FAQS = {
  general: [
    {q:'What does KASH General Suppliers do?', a:'We operate in three main sectors: agriculture and food, transport and logistics (including rides), and hospitality and accommodation.'},
    {q:'Where do you operate?', a:'We provide goods and services across Kenya, in both urban and rural areas, subject to agreed service requirements and operational arrangements.'},
    {q:'Who do you serve?', a:'Government institutions, private companies, NGOs, schools, hospitals, hotels and restaurants, community organizations, and individual customers and households.'},
    {q:'How do I place a request?', a:'Use the quote form, the request buttons on each service page, or message us. We reply as soon as we can to confirm details and pricing.'},
    {q:'Do I pay when I send a request?', a:'No. Sending a request only tells us what you need. We confirm availability and the price with you before anything is charged.'},
  ],
  agro: [
    {q:'What do you sell?', a:'Our online catalogue lists chicken, eggs, beef and goat meat. We also supply cereals, grains, vegetables, fruits, dry foodstuffs and other farm products, including bulk supply to institutions. Send us a request and we will confirm availability and price.'},
    {q:'Can I order small quantities?', a:'Yes. We supply households as well as restaurants, hotels, butcheries and bulk buyers.'},
    {q:"What are today's prices?", a:'Meat and egg prices move with the market, so we confirm the current price in your quote.'},
    {q:'Do you deliver?', a:'Yes. Add your delivery place and preferred date to the quote form and we confirm what is possible.'},
  ],
  transport: [
    {q:'What can you carry?', a:'Bulk and heavy cargo on our truck. Tell us what you are moving and we confirm it fits.'},
    {q:'Can you handle regular deliveries?', a:'Yes. We can set up recurring runs for shops, farms and businesses. Mention it in your request.'},
    {q:'How is transport priced?', a:'Container trucking from the Nairobi ICD / CFS depots follows our published rate card, per destination and before 16% VAT. Other jobs are priced by distance, load and vehicle. Either way you get a clear price before the trip begins.'},
    {q:'Is VAT included in the rate card?', a:'No. All rates are subject to 16% VAT. Switch the rate card to With VAT to see the total. Parking charges, delays in offloading or pre-advice, and excess weight at the weighbridge are chargeable.'},
  ],
  mobility: [
    {q:'How do I book a ride?', a:'Tap Request a ride, tell us where from, where to and when. We confirm the vehicle and price.'},
    {q:'Can you do airport transfers?', a:'Yes. Share your flight time and we plan pickups so you arrive on time.'},
    {q:'What can I book?', a:'Uber-style cab rides and tuk-tuk rides.'},
  ],
  stays: [
    {q:'How does booking work?', a:'Send your dates and guests with Check availability. We confirm the home, the total price and how to reserve.'},
    {q:'Can I stay for a month or longer?', a:'Yes. Long stays are welcome and we can discuss flexible terms.'},
    {q:'Can you arrange conferences and corporate stays?', a:'Yes. We coordinate hotel bookings, business travel accommodation, conference and meeting venues, catering and event hospitality. Tell us your dates and numbers through the contact form.'},
    {q:'What time is check-in?', a:'Standard check-in is from 2:00 PM and check-out by 11:00 AM. Earlier or later times can often be arranged.'},
  ],
};
