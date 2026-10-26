/* =========================================================
   KASH - js/data/food.js
   Agro & food: categories and products (chicken, beef, goat, eggs).
========================================================= */
/* ---------- Agro & food ----------
   Product cards and category filters are generated from these lists; no new page/card markup is needed.
   For a new category, add one category entry and set each new product's category to its key.
   For a new product in an existing category, add a product entry and optionally add its ID to HOME_PRODUCT_IDS.
   Add the photo under /images (or update image-fallback.js if using /images/fallback).
   `price: null` shows "Ask for today's price". Put a number (e.g. price:450) to show "From KES 450".
   The catalogue is currently static frontend data, not editable through a staff settings screen. */
const PRODUCT_CATEGORIES = [
  {key:'Chicken', label:'Chicken', icon:'meat', note:'Whole birds and fresh cuts'},
  {key:'Beef',    label:'Beef',    icon:'meat', note:'Steak, ribs and stewing beef'},
  {key:'Goat',    label:'Goat meat',icon:'meat', note:'Fresh goat meat'},
  {key:'Eggs',    label:'Eggs',    icon:'egg',  note:'Farm-fresh eggs'},
];
const PRODUCTS = [
  {id:'f1', name:'Whole chicken',    category:'Chicken', tag:'Farm fresh',      price:null, unit:'kg',    img:'chicken-whole.jpg',      desc:'A whole fresh chicken, hygienically packed and ready to cook.'},
  {id:'f2', name:'Chicken wings',    category:'Chicken', tag:'Fresh & healthy', price:null, unit:'kg',    img:'chicken-wings.jpg',      desc:'Fresh chicken wings, perfect for the grill, oven or frying pan.'},
  {id:'f3', name:'Chicken thighs',   category:'Chicken', tag:'Fresh & healthy', price:null, unit:'kg',    img:'chicken-thighs.jpg',     desc:'Juicy chicken thighs, a favourite for stews and roasting.'},
  {id:'f4', name:'Chicken drumsticks',category:'Chicken',tag:'Fresh & healthy', price:null, unit:'kg',    img:'chicken-drumsticks.jpg', desc:'Fresh drumsticks, well packed and delivered cold.'},
  {id:'f5', name:'Beef steak',       category:'Beef',    tag:'Premium quality', price:null, unit:'kg',    img:'beef-steak.jpg',         desc:'Premium beef steak cuts for grilling and pan-frying.'},
  {id:'f6', name:'Beef ribs',        category:'Beef',    tag:'Premium quality', price:null, unit:'kg',    img:'beef-ribs.jpg',          desc:'Meaty beef ribs, ideal for slow cooking and the braai.'},
  {id:'f7', name:'Fresh beef',       category:'Beef',    tag:'Natural & fresh', price:null, unit:'kg',    img:'beef-fresh.jpg',         desc:'Fresh beef pieces for stews, curries and everyday cooking.'},
  {id:'f8', name:'Goat meat',        category:'Goat',    tag:'Fresh goat meat', price:null, unit:'kg',    img:'goat-meat.jpg',                       desc:'Fresh goat meat, cut and packed to your order.'},
  {id:'f9', name:'Fresh eggs',       category:'Eggs',    tag:'Farm fresh',      price:null, unit:'tray',  img:'eggs-fresh.jpg',         desc:'Clean, farm-fresh eggs in trays for homes, shops and kitchens.'},
];
const HOME_PRODUCT_IDS = ['f1','f5','f8','f9','f2','f6'];   /* the six shown on the home page */
const AGRO_WHO = [
  {icon:'bed',    title:'Households',               desc:'Weekly or monthly fresh meat and egg deliveries for your family.'},
  {icon:'kitchen',title:'Restaurants & hotels',     desc:'Consistent supply so your kitchen never runs short.'},
  {icon:'bag',    title:'Butcheries & shops',       desc:'Bulk orders with fair pricing and reliable restocking.'},
  {icon:'users',  title:'Schools & institutions',   desc:'Large, scheduled orders with dependable delivery.'},
];
const AGRO_STEPS = [
  {title:'Pick your products', desc:'Browse chicken, beef, goat and eggs and add what you need to your quote.'},
  {title:'Send your request',  desc:'Add quantities, delivery place and your preferred date.'},
  {title:'Receive your quote', desc:"We confirm availability and today's price."},
  {title:'Get it delivered',   desc:'Fresh goods arrive on schedule, with the same quality every time.'},
];
const AGRO_PROMISES = [
  'Sourced from trusted farms and suppliers',
  'Hygienically packed and clearly labelled',
  'Delivered on the day and time we agree',
  'Flexible quantities, from household to bulk',
  'One point of contact for all your supply needs',
];
