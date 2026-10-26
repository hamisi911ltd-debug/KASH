/* =========================================================
   KASH - js/data/quote.js
   The "Get a quote" options (truck, Uber, tuk-tuk, delivery...).
========================================================= */
/* ---------- "Get a quote" chooser ---------- */
const QUOTE_MODES = [
  {key:'truck',    title:'Truck',      sub:'Cargo & freight',    icon:'truck',  color:'blue'},
  {key:'uber',     title:'Uber / cab', sub:'Rides around town',  icon:'car',    color:'amber'},
  {key:'tuktuk',   title:'Tuk-tuk',    sub:'Short local trips',  icon:'tuktuk', color:'teal'},
  {key:'delivery', title:'Delivery',   sub:'Parcels & packages', icon:'box',    color:'red'},
];
const QUOTE_MORE = [
  {key:'food',  title:'Order food',   service:'Agro & Food',          icon:'meat'},
  {key:'stay',  title:'Book a stay',  service:'Hospitality & Airbnb', icon:'bed'},
  {key:'other', title:'Something else', service:'Something else',     icon:'info'},
];
/* older links like #/quote/Agro%20%26%20Food still work */
const MODE_ALIASES = {'Transport & Logistics':'truck', 'Mobility & Ride Services':'uber', 'Agro & Food':'food', 'Hospitality & Airbnb':'stay', 'Something else':'other'};
const RIDE_SPEED = {uber:30, tuktuk:22};   /* average km/h used for the arrival estimate */
