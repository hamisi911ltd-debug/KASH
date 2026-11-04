/* =========================================================
   KASH - js/data/slides.js
   Home banner slides and the photo slideshows on each page.
========================================================= */
/* ---------- Slideshows ---------- */
/* Home banner: one photo per slide. sc/ox/oy = slow zoom, pos/mpos = photo focus on desktop/phone, mimg = lighter photo for phones and tablets.
   index.html carries a copy of the first slide (.hero-shell) so the first screen shows before the scripts run: change it there too. */
const HERO_SLIDES = [
  {img:'hero/d-poultry-farm.webp',   alt:'Hens roaming at a modern poultry farm at sunset', sc:1.1, ox:'70%', oy:'50%', pos:'center', mimg:'hero/poultry-farm.webp', mpos:'50% 50%',
   h1:'From our farms to your table.', p:'Quality food, reliable transport, modern mobility and comfortable stays, all in one place.',
   a:['Explore our services','#/services'], b:['Get a quote','#/quote'], place:['Kenya','From farm to table']},
  {img:'hero/d-hero-truck.webp',     alt:'A KASH truck on the Kenyan coast with Mombasa behind it', sc:1.15, ox:'70%', oy:'60%', pos:'left center', mimg:'hero/hero-truck.webp', mpos:'50% bottom',
   h1:'Your cargo, on time, every time.', p:'A branded, well-maintained truck moving goods across Kenya, from the coast to the highlands.',
   a:['Request a truck','#/quote/truck'], b:['See our fleet','#/fleet'], place:['Mombasa','Our coast, our pride']},
  {img:'hero/d-mombasa-beach.webp',  alt:'A white sand beach and turquoise sea on the Mombasa coast', sc:1.2, ox:'100%', oy:'60%', pos:'center', mimg:'hero/mombasa-beach.webp', mpos:'50% 50%',
   h1:'We make life easier for you.', p:'Comfortable stays and local experiences in prime locations, with the same KASH care.',
   a:['Find a stay','#/properties'], b:['All services','#/services'], place:['Mombasa','Stays by the sea']},
  {img:'hero/d-nairobi.webp',        alt:'The Nairobi skyline with the KICC tower', sc:1.3, ox:'100%', oy:'55%', pos:'center', mimg:'hero/nairobi.webp', mpos:'50% 50%',
   h1:'Getting around, made simple.', p:'Uber rides, cabs and tuk-tuks for quick, comfortable trips around town.',
   a:['Request a ride','#/quote/uber'], b:['All services','#/services'], place:['Nairobi','The city we move']},
  {img:'hero/d-delivery-city.webp',  alt:'A KASH rider on a branded motorbike delivering through Nairobi', sc:1.03, ox:'50%', oy:'40%', pos:'center 12%', mimg:'hero/delivery-city.webp', mpos:'50% 40%',
   h1:'Fast. Safe. Reliable delivery.', p:'From a parcel at your door to a rush across the city. We pick up, we ride, we deliver.',
   a:['Request a delivery','#/quote/delivery'], b:['How it works','#/services'], place:['Nairobi','Delivered with care']},
];
/* Photo slideshows in the top-right card of each page. */
const PAGE_SLIDES = {
  /* Each page opens on its OWN first photo. To change one, edit its list; to add photos, drop them in /images. */
  transport:  [{img:'fallback/truck.webp', alt:'A KASH truck on a coastal road'}, {img:'fallback/delivery-doorstep.webp', alt:'A KASH rider handing a KASH bag to a customer'}],
  fleet:      [{img:'fallback/truck-coast.webp', alt:'A KASH truck driving past the Mombasa coast'}, {img:'fallback/tuktuk.webp', pos:'50% 82%', alt:'Tuk-tuks lined up on a street'}, {img:'fallback/car.webp', alt:'A black KASH cab'}],
  mobility:   [{img:'kicc.webp', pos:'50% 50%', alt:'Kenyatta International Convention Centre above the Nairobi skyline', place:'Nairobi'}, {img:'fallback/mombasa-beach.webp', pos:'50% 50%', alt:'White sand and turquoise water along the Mombasa coast', place:'Mombasa coast'}],
  agro:       [{img:'fallback/goat.webp', pos:'50% 30%', alt:'A healthy goat on a farm'}, {img:'fallback/chicken-whole.webp', alt:'KASH whole chicken pack'}, {img:'fallback/eggs-fresh.webp', alt:'KASH fresh eggs pack'}],
  products:   [{img:'fallback/goat-meat.webp', alt:'KASH goat meat pack'}, {img:'fallback/beef-steak.webp', alt:'KASH beef steak pack'}, {img:'fallback/chicken-wings.webp', alt:'KASH chicken wings pack'}, {img:'fallback/beef-ribs.webp', alt:'KASH beef ribs pack'}],
  properties: [{img:'stay-living.webp', pos:'50% 62%', alt:'The studio lounge with a blue corner sofa, a feature shelf divider and a gold-trimmed ceiling'}, {img:'stay-bedroom.webp', pos:'50% 58%', alt:'The studio bedroom with a navy headboard, a double bed and a balcony window'}],
  about:      [{img:'fallback/mombasa.webp', alt:'Mombasa coast and Fort Jesus'}, {img:'fallback/tea-farm.webp', alt:'A farmer picking tea'}],
};
