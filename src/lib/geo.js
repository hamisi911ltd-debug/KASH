/* ============================================================
   Coordinates for the place names used across seed trips/bookings/
   the company address - enough to put a marker down without needing
   a paid geocoding API. Nairobi-area suburbs + the long-haul route
   towns already in src/lib/seed.js.
   ============================================================ */
export const PLACE_COORDS = {
  "Nairobi": [-1.2864, 36.8172],
  "Nairobi CBD": [-1.2833, 36.8167],
  "Mombasa": [-4.0435, 39.6682],
  "Kisumu": [-0.0917, 34.7680],
  "Eldoret": [0.5143, 35.2698],
  "Nakuru": [-0.3031, 36.0800],
  "Nanyuki": [0.0167, 37.0667],
  "Malindi": [-3.2192, 40.1169],
  "Kericho": [-0.3689, 35.2861],
  "JKIA": [-1.3192, 36.9278],
  "Naivasha": [-0.7167, 36.4333],
  "Westlands": [-1.2647, 36.8028],
  "Kilimani": [-1.2921, 36.7872],
  "Karen": [-1.3192, 36.7076],
  "Kileleshwa": [-1.2814, 36.7789],
  "Eastleigh": [-1.2767, 36.8447],
  "South B": [-1.3122, 36.8347],
  "Lavington": [-1.2789, 36.7686],
  "Buruburu": [-1.2833, 36.8833],
};

export function coordsFor(placeName) {
  return PLACE_COORDS[placeName] || null;
}

/** KASH's head office - shown as the property pin on the Hospitality map. */
export const COMPANY_COORDS = [-1.2921, 36.7872]; // Kilimani, Nairobi
