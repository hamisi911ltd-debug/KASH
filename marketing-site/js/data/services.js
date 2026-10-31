/* =========================================================
   KASH - js/data/services.js
   The four services, transport content, the fleet and ride content.
========================================================= */
/* ---------- The four services (same as the home page) ---------- */
const SERVICES = [
  {key:'Agro & Food',                 route:'agro',       title:'Agriculture & food',     short:'Farm produce and bulk food supply.', img:'hens.webp',          color:'teal',  icon:'leaf'},
  {key:'Transport & Logistics',       route:'transport',  title:'Transport & logistics',  short:'Goods, cargo and logistics support.', img:'truck.jpg',         color:'blue',  icon:'truck'},
  {key:'Mobility & Ride Services',    route:'mobility',   title:'Mobility & ride services',short:'Uber rides, cabs and tuk-tuks for local trips.', img:'car.jpg',           color:'amber', icon:'car'},
  {key:'Hospitality & Airbnb',        route:'properties', title:'Hospitality & accommodation', short:'Stays, venues, catering and events.', img:'alina-studio-1.jpg', color:'red',   icon:'bed'},
];
const SERVICE_OPTIONS = SERVICES.map(s => s.key).concat(['Something else']);

/* ---------- Transport & logistics ---------- */
const FREIGHT_SERVICES = [
  {icon:'trailer', title:'Truck transport',        desc:'Heavy and bulk cargo moved safely across the country.'},
  {icon:'box',     title:'Cargo & parcels',        desc:'Careful handling, loading and on-time delivery.'},
  {icon:'calendar',title:'Contracts & long-haul',  desc:'Regular routes and long-distance freight on a schedule.'},
];
const FREIGHT_STEPS = [
  {title:'Tell us what to move',  desc:'Share pickup, destination, date and what you are sending.'},
  {title:'Get a clear price',     desc:'We confirm the vehicle and the cost before anything moves.'},
  {title:'We collect and deliver',desc:'An experienced driver loads, transports and delivers safely.'},
  {title:'Confirm and done',      desc:'You confirm receipt and we stay on call for anything else.'},
];
const FREIGHT_WHY = [
  'A branded, well-maintained truck checked regularly',
  'Experienced, vetted drivers',
  'Clear pricing agreed before the trip',
  'One-off jobs and regular contract runs',
  'Real people on call while your goods are on the road',
];
const FREIGHT_WHO = [
  {icon:'bag',   title:'Shops & businesses', desc:'Restocking runs, supplier collections and regular deliveries.'},
  {icon:'leaf',  title:'Farmers & traders',  desc:'Moving goods and bulk loads from farm to market.'},
  {icon:'box',   title:'Movers & events',    desc:'Furniture, equipment and stock for relocations and events.'},
  {icon:'users', title:'Individuals',        desc:'Large items, one-off loads and personal deliveries.'},
];

/* ---------- Fleet ----------
   Our fleet today: a truck, tuk-tuks and Uber/cab rides.
   Add a vehicle by copying a block. `img` is optional, `pos` = photo focus (CSS object-position). */
const VEHICLES = [
  {id:'v1', group:'freight', category:'Trucks',       mode:'truck',    name:'KASH Truck',  sub:'Cargo truck', capacity:'Heavy & bulk cargo',   best:'Bulk loads and long-haul freight',           available:true, img:'truck.jpg',   pos:''},
  {id:'v2', group:'ride',    category:'Uber & cabs',  mode:'uber',     name:'Uber / cab',  sub:'Cab',         capacity:'Up to 4 passengers',   best:'City rides, meetings and airport runs',      available:true, img:'car.jpg',     pos:''},
  {id:'v3', group:'ride',    category:'Tuktuks',      mode:'tuktuk',   name:'Tuk-tuk',     sub:'Tuk-tuk',     capacity:'Up to 3 passengers',   best:'Short, quick local trips',                   available:true, img:'tuktuk.jpg',  pos:'50% 82%'},
];
const VEHICLE_ICON = {'Trucks':'truck', 'Uber & cabs':'car', 'Tuktuks':'tuktuk'};
const FLEET_FILTERS = ['All','Trucks','Uber & cabs','Tuktuks'];

/* ---------- Mobility & ride services ---------- */
const RIDE_SERVICES = [
  {icon:'car',    title:'Uber & cab rides', desc:'Comfortable, clean cars for city trips, meetings and airport runs.', href:'#/quote/uber', action:'Request a car ride'},
  {icon:'tuktuk', title:'Tuk-tuks',         desc:'Affordable, quick rides for short local trips.', href:'#/quote/tuktuk', action:'Request a tuk-tuk'},
];
const RIDE_STEPS = [
  {title:'Request a ride',   desc:'Tell us where from, where to and when you need to go.'},
  {title:'We confirm',       desc:'You get the vehicle, driver and price before the trip.'},
  {title:'Ride with care',   desc:'A courteous driver collects you on time.'},
  {title:'Arrive & pay',     desc:'Reach your destination safely and settle up simply.'},
];
const RIDE_WHO = [
  {icon:'clock', title:'Airport & station transfers', desc:'On-time pickups so you never miss a flight or train.'},
  {icon:'users', title:'Meetings & business trips',   desc:'Clean, comfortable cabs for client visits and appointments.'},
  {icon:'bag',   title:'Daily errands',               desc:'Quick local trips around town, any day of the week.'},
  {icon:'shield',title:'Safe night rides',            desc:'Trusted drivers when you are travelling after dark.'},
];
