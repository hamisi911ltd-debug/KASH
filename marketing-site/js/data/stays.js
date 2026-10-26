/* =========================================================
   KASH - js/data/stays.js
   Homes and Airbnbs: details, photos, map coordinates, house rules.
========================================================= */
/* ---------- Hospitality & Airbnb ----------
   `img` = card photo, `pos` = photo focus, `gallery` = extra photos for the detail page. */
const PROPERTIES = [
  {id:'p1', lat:-1.2921, lng:36.8219, approx:true, name:'Modern 2 Bedroom Apartment', city:'Nairobi', location:'Nairobi, Kenya', type:'Apartment', beds:2, baths:2, guests:4, wifi:true, price:8500,  rating:'4.8', reviews:24, img:'nairobi.jpg', pos:'30% 50%', gallery:[],
   desc:'A spacious, modern 2 bedroom apartment with a fully equipped kitchen, a comfortable living room and great city views. Perfect for families, couples or business travelers.',
   amenities:['wifi','ac','kitchen','parking','tv','lock']},
  {id:'p2', lat:-1.2921, lng:36.8219, approx:true, name:'Cozy Studio Apartment',      city:'Nairobi', location:'Nairobi, Kenya', type:'Apartment', beds:1, baths:1, guests:2, wifi:true, price:6500,  rating:'4.7', reviews:18, img:'alina-studio-2.jpg', pos:'50% 62%', gallery:['alina-studio-2.jpg','alina-studio-1.jpg'],
   desc:'A bright, stylish studio with a comfy bed, a lounge area with a blue sofa and a balcony view of the trees. Ideal for solo travelers, couples or short business trips, close to the city centre.',
   amenities:['wifi','kitchen','tv','lock']},
  {id:'p3', lat:-1.2921, lng:36.8219, approx:true, name:'Luxury 3 Bedroom Apartment', city:'Nairobi', location:'Nairobi, Kenya', type:'Apartment', beds:3, baths:3, guests:6, wifi:true, price:12000, rating:'4.9', reviews:31, img:'nairobi.jpg', pos:'75% 50%', gallery:[],
   desc:'An elegant 3 bedroom home with premium finishes, a private balcony and secure parking, built for families and extended stays.',
   amenities:['wifi','ac','kitchen','parking','tv','lock']},
  {id:'p4', lat:-4.0435, lng:39.6682, approx:true, name:'Beachfront Airbnb Home',     city:'Mombasa', location:'Mombasa, Kenya', type:'Airbnb',    beds:3, baths:3, guests:7, wifi:true, price:18000, rating:'4.9', reviews:42, img:'mombasa-beach.jpg', pos:'50% 50%', gallery:[],
   desc:'Wake up to ocean views in this beachfront home with a private pool deck, perfect for a relaxed getaway with family or friends.',
   amenities:['wifi','ac','pool','kitchen','parking','lock']},
];
/* lat/lng above are city-centre PLACEHOLDERS. Put each home's real coordinates (right-click the spot in Google Maps and copy the numbers).
   approx:true shows "approximate area - exact address shared after booking". */
const CITY_PHOTOS = [
  {city:'Nairobi', img:'nairobi.jpg',       line:'Stays in the heart of the city'},
  {city:'Mombasa', img:'mombasa-beach.jpg', line:'Stays on the Kenyan coast'},
];
const AMENITY_LABELS = {wifi:'Free Wi-Fi', ac:'Air conditioning', kitchen:'Fully equipped kitchen', parking:'Secure parking', tv:'Smart TV', lock:'24/7 security', pool:'Private pool deck'};
const STAY_TYPES = [
  {icon:'clock',    title:'Short stays',       desc:'Weekend getaways, business trips and quick visits, from one night.'},
  {icon:'calendar', title:'Long stays',        desc:'Extended stays for relocations and projects, with flexible terms.'},
  {icon:'users',    title:'Families & groups', desc:'Multi-bedroom homes with space to cook, relax and stay together.'},
];
const STAY_STEPS = [
  {title:'Browse & choose',    desc:'Filter by place and bedrooms, then open a home for full details.'},
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
