/* =========================================================
   KASH - js/assistant/assistant-data.js
   What the assistant says. Edit the wording and keywords here;
   the logic lives in assistant.js.

   How a reply is chosen
   1. If the message looks like a complaint, payment, bulk order,
      contract, or "I want a person", it is a HANDOFF to customer service.
   2. Otherwise the intent with the most matching keywords wins.
   3. A word ending in * matches any ending: "deliver*" = deliver, delivery, delivered.

   In a reply you can use {hours} {phone} {email} {location} - they are
   filled in from js/config.js.
========================================================= */
'use strict';

const ASSISTANT = {

  /* Buttons shown at the start and after most answers */
  startChips: ['Get a quote', 'Order food', 'Book a stay', 'Request a ride', 'Send a delivery', 'Talk to a person'],

  /* What each page's welcome message says. {name} = the home being viewed. */
  greetings: {
    home:       "Hi, I'm the KASH assistant. What would you like to do today?",
    products:   "Looking for something to order? Tell me what you need, or pick a product and add it to your quote.",
    agro:       "Looking for chicken, beef, goat meat or eggs? I can take you to the products or start a quote.",
    properties: "Looking for a place to stay? I can help you find a home or check availability.",
    property:   "Looking at {name}? I can help you check availability or show you where it is.",
    transport:  "Need something moved? I can start a truck or delivery request for you.",
    fleet:      "Want to book one of our vehicles? Tell me which and I'll open the request.",
    mobility:   "Need a ride? I can open the request and show you how far our nearest car is.",
    quote:      "Pick what you need above and I'll help you fill it in. Not sure which? Just ask me.",
    contact:    "Want to reach the team? I can show you our contact options or send a message to customer service.",
    other:      "Hi, I'm the KASH assistant. How can I help you?",
  },

  /* Chips shown under the welcome message, per page (falls back to startChips) */
  pageChips: {
    property:   ['Check availability', 'Where is it?', 'Talk to a person'],
    products:   ['Get a quote', 'What do you sell?', 'Talk to a person'],
    mobility:   ['Request a ride', 'Request a tuk-tuk', 'How much is a ride?'],
    transport:  ['Request a truck', 'Send a delivery', 'How much does it cost?'],
  },

  /* Answers. Order matters only when two intents score the same. */
  intents: [
    { id:'greet', words:['hello','hi','hey','habari','jambo','mambo','sasa','good morning','good afternoon','good evening'],
      reply:'Hello! How can I help you today?' },

    { id:'price', words:['price*','cost*','how much','rate*','charge*','fee*','cheap*','expensive','afford*'],
      reply:"The price depends on what you need. We always confirm it with you before anything is charged. Tell me what it's for and I'll start the right request.",
      chips:['Get a quote', 'Request a ride', 'Send a delivery'] },

    { id:'tuktuk', words:['tuktuk','tuktuks'],
      reply:"A tuk-tuk is great for short, quick local trips. Share where you are and I'll show how far the nearest one is.",
      actions:[{label:'Request a tuk-tuk', href:'#/quote/tuktuk'}] },

    { id:'ride', words:['uber','cab*','taxi','ride*','airport transfer','pick me up','pickup','lift'],
      reply:"I can set up a ride for you. Tap \"Use my location\" on the form and you'll see how far our nearest car is.",
      actions:[{label:'Request an Uber / cab', href:'#/quote/uber'}, {label:'Request a tuk-tuk', href:'#/quote/tuktuk'}] },

    { id:'delivery', words:['deliver*','parcel*','package*','courier','dispatch','document*','send something','rider*'],
      reply:"Our riders collect your parcel and deliver it to the door. We confirm the price before we ride.",
      actions:[{label:'Request a delivery', href:'#/quote/delivery'}] },

    { id:'truck', words:['truck*','cargo','freight','lorry','haul*','trailer*','relocat*','moving house','move house','heavy load','goods'],
      reply:"Our KASH truck carries bulk and heavy cargo. Tell us what you're moving and where, and we'll confirm the truck and price.",
      actions:[{label:'Request a truck', href:'#/quote/truck'}, {label:'See the fleet', href:'#/fleet'}] },

    { id:'food', words:['food','chicken','beef','goat','meat','egg*','steak','ribs','wings','drumstick*','thigh*','butcher*','sell','products','buy'],
      reply:"We supply chicken, beef, goat meat and eggs, packed fresh and delivered. Add what you need to your quote and we'll confirm today's price.",
      actions:[{label:'See products', href:'#/products'}, {label:'Start a food quote', href:'#/quote/food'}] },

    { id:'availability', words:['availab*'],
      reply:"To check a home's availability, open it, pick your dates and tap Check availability. We reply with the total price and how to reserve.",
      actions:[{label:'Browse stays', href:'#/properties'}] },

    { id:'stay', words:['stay*','apartment*','airbnb','room*','hotel','night*','accommodation','mombasa','nairobi','beach','book*','holiday','vacation'],
      reply:"We have homes in Nairobi and Mombasa, from a cozy studio to a beachfront house. Open one to see photos and its map, then check availability.",
      actions:[{label:'Browse stays', href:'#/properties'}] },

    { id:'quote', words:['quote*','estimate*','request*','enquir*','inquir*'],
      reply:"Happy to help. Pick what you need (truck, Uber, tuk-tuk, delivery, food or a stay) and I'll take you there.",
      actions:[{label:'Get a quote', href:'#/quote'}] },

    { id:'fleet', words:['fleet','vehicle*','car*','what do you have'],
      reply:"Our fleet today is a KASH truck for cargo, Uber-style cabs and tuk-tuks for rides.",
      actions:[{label:'See the fleet', href:'#/fleet'}] },

    { id:'where', words:['where is it','where is this','where is the','map','directions','how do i get there'],
      reply:"Each home has a map on its page. Open a home and scroll to Location. For exact addresses, we share them once your stay is confirmed.",
      actions:[{label:'Browse stays', href:'#/properties'}] },

    { id:'contact', words:['contact*','phone','call','number','email','address','office','hours','open','close','closing','location','whatsapp','reach'],
      reply:"You can reach us here:\nHours: {hours}\nPhone: {phone}\nEmail: {email}\nBased in: {location}",
      actions:[{label:'Contact page', href:'#/contact'}] },

    { id:'about', words:['about kash','about you','about us','who are you','what do you do','services','what is kash','company'],
      reply:"KASH General Suppliers brings four services together: agro and food, transport and logistics, mobility and rides, and hospitality and Airbnb stays.",
      actions:[{label:'See our services', href:'#/services'}] },

    { id:'thanks', words:['thanks','thank you','asante','cheers','appreciate*'],
      reply:"You're welcome! Is there anything else I can help you with?" },
  ],

  /* HANDOFF: things a person should handle. */
  handoff: {
    words:['complain*','refund*','money back','damaged','broken','lost','late','delay*','not delivered','wrong order','angry','unhappy','bad service',
           'urgent*','emergency','accident*','injur*','stolen','police','lawyer','legal','sue',
           'pay','paying','payment*','mpesa','m-pesa','invoice*','receipt*',
           'contract*','tender*','wholesale','bulk','partner*','sponsor*','job*','career*','vacanc*',
           'track*','where is my','status of my',
           'speak to','talk to','human','agent','representative','customer service','manager','call me','someone','a person'],
    longMessage: 220,        /* a message longer than this is treated as a heavy request */
    connecting:  "This one needs our team. We are connecting you to our customer service. Please hold on...",
    connectingMs: 2600,
    ask:         "Our customer service team is the right place for this. Leave your name and phone number and they will contact you as soon as they can.",
    safety:      "If anyone is hurt or in danger, please call 999 or 112 first.",
    done:        "Thank you, {name}. A team member will contact you on {phone}. Our hours are {hours}.",
    safetyWords: ['accident*','injur*','emergency','hurt'],
  },

  fallback: "I'm not sure I understood that. Could you tell me what you'd like to do? You can also pick one of these.",
  fallbackLimit: 2,          /* after this many misses in a row, offer customer service */
};
