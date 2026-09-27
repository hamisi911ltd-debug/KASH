/* ============================================================
   Single source of truth for every listed property - the grid on
   hospitality.html and the detail page (property.html?id=<slug>) both
   read from this one array, so a price/photo/description only ever
   needs updating in one place.

   `mapQuery` is a plain place name/area fed straight into Google's
   key-less embed (`google.com/maps?q=...&output=embed`) and into a
   "Get Directions" link - it's a placeholder neighbourhood, not a
   verified street address. Swap it for the property's real address
   (or "lat,lng" coordinates, which work the same way) as soon as you
   have it, so the pin lands on the right building rather than just
   the general area.
   ============================================================ */
const PROPERTIES = [
  {
    slug: "modern-2-bedroom-apartment",
    title: "Modern 2 Bedroom Apartment",
    type: "Apartment",
    location: "Nairobi, Kenya",
    mapQuery: "Kilimani, Nairobi, Kenya",
    beds: 2, baths: 2, wifi: true,
    price: 8500,
    image: "images/apartment1.jpg",
    description: "A bright, modern 2 bedroom apartment in a quiet, well-secured Kilimani compound - close to shops, restaurants and the CBD. Comfortably fits a family or two working professionals sharing.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Modern%202%20Bedroom%20Apartment",
  },
  {
    slug: "cozy-studio-apartment",
    title: "Cozy Studio Apartment",
    type: "Apartment",
    location: "Nairobi, Kenya",
    mapQuery: "Westlands, Nairobi, Kenya",
    beds: 1, baths: 1, wifi: true,
    price: 6500,
    image: "images/hospitality.jpg",
    description: "A cozy, self-contained studio in Westlands, ideal for a solo traveller or a couple on a short stay - walking distance to malls, cafes and nightlife.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Cozy%20Studio%20Apartment",
  },
  {
    slug: "luxury-3-bedroom-apartment",
    title: "Luxury 3 Bedroom Apartment",
    type: "Airbnb",
    location: "Nairobi, Kenya",
    mapQuery: "Kileleshwa, Nairobi, Kenya",
    beds: 3, baths: 3, wifi: true,
    price: 12000,
    image: "images/apartment2.jpg",
    description: "A spacious, beautifully furnished 3 bedroom home in leafy Kileleshwa - great for a family holiday, a small group, or hosting visiting relatives in comfort.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Luxury%203%20Bedroom%20Apartment",
  },
  {
    slug: "beachfront-airbnb-home",
    title: "Beachfront Airbnb Home",
    type: "Airbnb",
    location: "Mombasa, Kenya",
    mapQuery: "Nyali Beach, Mombasa, Kenya",
    beds: 3, baths: 3, wifi: true,
    price: 18000,
    image: "images/pool1.jpg",
    description: "Wake up to the ocean in this beachfront home on Nyali Beach, Mombasa - private pool, palm-shaded garden, and the beach a few steps from the door.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Beachfront%20Airbnb%20Home",
  },
  {
    slug: "self-contained-kitchen-suite",
    title: "Self-Contained Kitchen Suite",
    type: "Apartment",
    location: "Nairobi, Kenya",
    mapQuery: "Lavington, Nairobi, Kenya",
    beds: 2, baths: 1, wifi: true,
    price: 9000,
    image: "images/kitchen.jpg",
    description: "A well-equipped suite in Lavington with a full kitchen - a good fit for a longer stay where you'd rather cook than eat out every night.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Self-Contained%20Kitchen%20Suite",
  },
  {
    slug: "garden-view-apartment",
    title: "Garden View Apartment",
    type: "Apartment",
    location: "Nairobi, Kenya",
    mapQuery: "Karen, Nairobi, Kenya",
    beds: 2, baths: 2, wifi: true,
    price: 10500,
    image: "images/living-room.jpg",
    description: "A calm, garden-facing apartment in leafy Karen - a good escape from the city noise, while still a straightforward drive from the CBD.",
    whatsapp: "https://wa.me/254722001004?text=Hi%2C%20I%27d%20like%20to%20book%20the%20Garden%20View%20Apartment",
  },
];
