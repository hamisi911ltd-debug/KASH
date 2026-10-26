/* =========================================================
   KASH - js/data/slides.js
   Home banner slides and the photo slideshows on each page.
========================================================= */
/* ---------- Slideshows ---------- */
/* Home banner: one photo per slide. sc/ox/oy = slow zoom, pos/mpos = photo focus on desktop/phone. */
const HERO_SLIDES = [
  {img:'poultry-farm.jpg',   alt:'Hens roaming at a modern poultry farm at sunset', sc:1.1, ox:'70%', oy:'50%', pos:'center', mpos:'60% 50%',
   h1:'From our farms to your table.', p:'Quality food, reliable transport, modern mobility and comfortable stays, all in one place.',
   a:['Explore our services','#/services'], b:['Get a quote','#/quote'], place:['Kenya','From farm to table']},
  {img:'hero-truck.jpg',     alt:'A KASH truck on the Kenyan coast with Mombasa behind it', sc:1.15, ox:'70%', oy:'60%', pos:'left center', mpos:'66% bottom',
   h1:'Your cargo, on time, every time.', p:'A branded, well-maintained truck moving goods across Kenya, from the coast to the highlands.',
   a:['Request a truck','#/quote/truck'], b:['See our fleet','#/fleet'], place:['Mombasa','Our coast, our pride']},
  {img:'mombasa-beach.jpg',  alt:'A white sand beach and turquoise sea on the Mombasa coast', sc:1.2, ox:'100%', oy:'60%', pos:'center', mpos:'30% 50%',
   h1:'We make life easier for you.', p:'Comfortable stays and local experiences in prime locations, with the same KASH care.',
   a:['Find a stay','#/properties'], b:['All services','#/services'], place:['Mombasa','Stays by the sea']},
  {img:'nairobi.jpg',        alt:'The Nairobi skyline with the KICC tower', sc:1.3, ox:'100%', oy:'55%', pos:'center', mpos:'50% 50%',
   h1:'Getting around, made simple.', p:'Uber rides, cabs and tuk-tuks for quick, comfortable trips around town.',
   a:['Request a ride','#/quote/uber'], b:['All services','#/services'], place:['Nairobi','The city we move']},
  {img:'fallback/delivery-city.png',  alt:'A KASH rider on a branded motorbike delivering through Nairobi', sc:1.03, ox:'50%', oy:'40%', pos:'center 12%', mpos:'58% 40%',
   h1:'Fast. Safe. Reliable delivery.', p:'From a parcel at your door to a rush across the city. We pick up, we ride, we deliver.',
   a:['Request a delivery','#/quote/delivery'], b:['How it works','#/services'], place:['Nairobi','Delivered with care']},
];
/* Photo slideshows in the top-right card of each page. */
const PAGE_SLIDES = {
  /* Each page opens on its OWN first photo. To change one, edit its list; to add photos, drop them in /images. */
  transport:  [{img:'truck.jpg', alt:'A KASH truck on a coastal road'}, {img:'fallback/delivery-doorstep.png', alt:'A KASH rider handing a KASH bag to a customer'}],
  fleet:      [{img:'truck-coast.jpg', alt:'A KASH truck driving past the Mombasa coast'}, {img:'tuktuk.jpg', pos:'50% 82%', alt:'Tuk-tuks lined up on a street'}, {img:'car.jpg', alt:'A black KASH cab'}],
  mobility:   [{img:'kicc.jpg', pos:'50% 50%', alt:'Kenyatta International Convention Centre above the Nairobi skyline', place:'Nairobi'}, {img:'fallback/mombasa-beach.jpg', pos:'50% 50%', alt:'White sand and turquoise water along the Mombasa coast', place:'Mombasa coast'}],
  agro:       [{img:'goat.jpg', pos:'50% 30%', alt:'A healthy goat on a farm'}, {img:'chicken-whole.jpg', alt:'KASH whole chicken pack'}, {img:'eggs-fresh.jpg', alt:'KASH fresh eggs pack'}],
  products:   [{img:'goat-meat.jpg', alt:'KASH goat meat pack'}, {img:'beef-steak.jpg', alt:'KASH beef steak pack'}, {img:'chicken-wings.jpg', alt:'KASH chicken wings pack'}, {img:'beef-ribs.jpg', alt:'KASH beef ribs pack'}],
  properties: [{img:'alina-studio-2.jpg', pos:'50% 62%', alt:'A bright studio apartment with a blue sofa'}, {img:'alina-studio-1.jpg', pos:'50% 60%', alt:'A studio apartment bedroom'}, {img:'mombasa-beach.jpg', alt:'The Mombasa beach'}, {img:'nairobi.jpg', alt:'The Nairobi skyline'}],
  about:      [{img:'mombasa.jpg', alt:'Mombasa coast and Fort Jesus'}, {img:'tea-farm.jpg', alt:'A farmer picking tea'}],
};
