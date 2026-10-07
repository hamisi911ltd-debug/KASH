const AMENITY_GROUPS = {
  "Essentials": [
    "Free Wi-Fi",
    "Water (24 hours)",
    "Hot water",
    "Backup power",
    "Towels provided",
    "Bed linen provided",
    "Toiletries provided",
    "Iron and ironing board",
    "Hair dryer",
    "Wardrobe or hangers",
    "Washing machine",
    "Drying rack"
  ],
  "Kitchen": [
    "Fully equipped kitchen",
    "Refrigerator",
    "Microwave",
    "Stove or cooker",
    "Kettle",
    "Coffee or tea maker",
    "Dishwasher",
    "Cooking basics (oil, salt, spices)",
    "Dining table"
  ],
  "Comfort and living": [
    "Furnished",
    "Air conditioning",
    "Fans",
    "Heating",
    "Smart TV",
    "Streaming subscription",
    "Sofa bed",
    "Balcony",
    "Garden access",
    "Blackout curtains",
    "Desk and chair"
  ],
  "Family": [
    "Kids' play area",
    "High chair",
    "Cot or crib available",
    "Extra blankets and pillows"
  ],
  "Bathroom": [
    "Private bathroom",
    "Shower",
    "Bathtub",
    "Extra bathroom"
  ],
  "Work": [
    "Dedicated workspace",
    "Fast fibre internet"
  ],
  "Leisure": [
    "Gym",
    "Swimming pool",
    "Hot tub",
    "Board games",
    "BBQ area",
    "Garden or outdoor seating"
  ],
  "Services": [
    "Restaurant on site",
    "Mini supermarket",
    "Laundry service",
    "Airport pickup",
    "Cleaning service",
    "Concierge"
  ],
  "Building and safety": [
    "24-hour security",
    "CCTV",
    "Parking",
    "Lift",
    "Smoke detector",
    "Fire extinguisher",
    "First aid kit",
    "Keyless entry"
  ],
  "Accessibility": [
    "Step-free access",
    "Wheelchair accessible"
  ],
  "House rules": [
    "Pets allowed",
    "Smoking allowed"
  ]
};
const AMENITIES = Object.values(AMENITY_GROUPS).flat();

/* ============================================================
   Every listed property - the grid on hospitality.html and the detail
   page (property.html?id=<slug>) both read from this one array.

   All units are in the Alina Ridge building, Kileleshwa, Nairobi. The
   building-wide facilities are kept once in BUILDING below so they're
   edited in one place.
   ============================================================ */
const BUILDING = {
  name: "Alina Ridge",
  area: "Kileleshwa, Nairobi, Kenya",
  // The embedded map and the directions link both use this.
  mapQuery: "Alina Ridge, Kileleshwa, Nairobi, Kenya",
  directionsUrl: "https://maps.app.goo.gl/83xZaM1rRdbBn2cW6",
  facilities: [
    "Free Wi-Fi in every unit",
    "Gym",
    "Parking across 3 levels (ground floor and 2 basements)",
    "Restaurant on site",
    "Mini supermarket",
    "Kids' play area",
    "24-hour security",
  ],
  notes: "There is no swimming pool at this building.",
};

const PROPERTIES = [
  {
    slug: "modern-2-bedroom-apartment",
    title: "Modern 2 Bedroom Apartment",
    type: "Apartment",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 2, baths: 2, wifi: true,
    price: 8500,
    image: "images/apartment1.jpg",
    gallery: [],
    description: "A modern 2 bedroom apartment at Alina Ridge in Kileleshwa - a quiet, secure building with a gym, restaurant and mini supermarket on site.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","Gym","24-hour security","Restaurant on site","Mini supermarket","Kids' play area","Lift","Furnished","Air conditioning","Balcony"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Modern%202%20Bedroom%20Apartment",
  },
  {
    slug: "cozy-studio-apartment",
    title: "Cozy Studio Apartment",
    type: "Apartment",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 1, baths: 1, wifi: true,
    price: 6500,
    image: "images/alina-studio-1.jpg",
    gallery: ["images/alina-studio-1.jpg", "images/alina-studio-2.jpg"],
    description: "A bright, self-contained studio at Alina Ridge with a comfortable living area, a separate sleeping area and a balcony view over the trees.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","Gym","24-hour security","Restaurant on site","Mini supermarket","Kids' play area","Lift","Furnished","Balcony"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Cozy%20Studio%20Apartment",
  },
  {
    slug: "luxury-3-bedroom-apartment",
    title: "Luxury 3 Bedroom Apartment",
    type: "Airbnb",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 3, baths: 3, wifi: true,
    price: 12000,
    image: "images/apartment2.jpg",
    gallery: [],
    description: "A spacious, well-furnished 3 bedroom home at Alina Ridge - good for a family stay, a small group, or visiting relatives.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","Gym","24-hour security","Restaurant on site","Mini supermarket","Kids' play area","Lift","Furnished","Air conditioning","Smart TV","Balcony","Fully equipped kitchen"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Luxury%203%20Bedroom%20Apartment",
  },
  {
    slug: "beachfront-airbnb-home",
    title: "Beachfront Airbnb Home",
    type: "Airbnb",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 3, baths: 3, wifi: true,
    price: 18000,
    image: "images/alina-studio-2.jpg",
    gallery: [],
    description: "A 3 bedroom Airbnb unit at Alina Ridge, Kileleshwa.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","24-hour security","Furnished","Smart TV"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Beachfront%20Airbnb%20Home",
  },
  {
    slug: "self-contained-kitchen-suite",
    title: "Self-Contained Kitchen Suite",
    type: "Apartment",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 2, baths: 1, wifi: true,
    price: 9000,
    image: "images/apartment1.jpg",
    gallery: [],
    description: "A self-contained suite at Alina Ridge with its own fully equipped kitchen - a good fit for a longer stay where you'd rather cook.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","Gym","24-hour security","Restaurant on site","Mini supermarket","Kids' play area","Lift","Fully equipped kitchen","Furnished"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Self-Contained%20Kitchen%20Suite",
  },
  {
    slug: "garden-view-apartment",
    title: "Garden View Apartment",
    type: "Apartment",
    location: BUILDING.area,
    mapQuery: BUILDING.mapQuery,
    beds: 2, baths: 2, wifi: true,
    price: 10500,
    image: "images/apartment2.jpg",
    gallery: [],
    description: "A calm apartment at Alina Ridge with a view over the surrounding greenery - a quiet escape while staying close to town.",
    amenities: ["Free Wi-Fi","Water (24 hours)","Parking","Gym","24-hour security","Restaurant on site","Mini supermarket","Kids' play area","Lift","Furnished","Balcony"],
    whatsapp: "https://wa.me/254142426451?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Garden%20View%20Apartment",
  },
];
