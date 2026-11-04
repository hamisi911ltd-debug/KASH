/* =========================================================
   KASH - js/data/stays.js
   Homes and Airbnbs: details, photos, map coordinates, house rules.
========================================================= */
/* ---------- Hospitality & Airbnb ----------
   `img` = card photo, `pos` = photo focus, `gallery` = extra photos for the detail page. */
const PROPERTIES = [
  {id:'p2', lat:-1.2921, lng:36.8219, approx:true, name:'Cozy Studio Apartment',      city:'Nairobi', location:'Nairobi, Kenya', type:'Apartment', beds:1, baths:1, guests:2, wifi:true, price:3500,  rating:'4.7', reviews:18, img:'stay-living.webp', pos:'50% 62%', gallery:['stay-living.webp','stay-bedroom.webp'],
   desc:'A stylish open-plan studio with a blue corner sofa, a feature shelf that sets the lounge apart from the bed, a gold-trimmed ceiling with a ring chandelier and soft spotlights, a double bed with a navy headboard, fitted wardrobes and a large window with a balcony over the trees. Ideal for solo travellers, couples and short business trips.',
   amenities:['wifi','kitchen','tv','lock']},
];
/* lat/lng above are city-centre PLACEHOLDERS. Put each home's real coordinates (right-click the spot in Google Maps and copy the numbers).
   approx:true shows "approximate area - exact address shared after booking". */
const CITY_PHOTOS = [
  {city:'Nairobi', img:'fallback/nairobi.webp',       line:'Stays in the heart of the city'},
];
const AMENITY_LABELS = {wifi:'Free Wi-Fi', ac:'Air conditioning', kitchen:'Fully equipped kitchen', parking:'Secure parking', tv:'Smart TV', lock:'24/7 security', pool:'Private pool deck'};
const STAY_TYPES = [
  {icon:'clock',    title:'Short stays',       desc:'Weekend getaways, business trips and quick visits, from one night.'},
  {icon:'calendar', title:'Long stays',        desc:'Extended stays for relocations and projects, with flexible terms.'},
];
const STAY_STEPS = [
  {title:'Browse & choose',    desc:'Open the stay to see photos, amenities and its map.'},
  {title:'Check availability', desc:'Send your dates and guests. No payment is needed to ask.'},
  {title:'We confirm',         desc:'We reply with availability, the total price and how to reserve.'},
  {title:'Check in & enjoy',   desc:'Clear directions, a smooth arrival and support if you need it.'},
];
const HOUSE_RULES = [
  'Check-in from 2:00 PM, check-out by 11:00 AM (flexible on request)',
  'A valid ID is required at check-in',
  'No parties or events without prior approval',
  'Smoking outdoors only',
  'Please treat the home as you would your own',
];
