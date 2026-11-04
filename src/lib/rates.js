/* ============================================================
   KASH Transport Rate Card: container trucking from the Nairobi
   ICD / CFS depots. Pure JS, no React or DOM, so the Worker (which
   loads it for "Load the standard rate card" and the public rates
   feed) and the ERP read exactly the same wording and figures.

   The live rates are a collection (see schema.js `rates`) that staff
   edit in the ERP's Rate card page; this list is what that collection
   starts from, and what the website shows if the ERP can't be reached.
   Order is the order of the printed card.
   ============================================================ */

export const RATE_VAT_PERCENT = 16;
export const RATE_ORIGIN = "ICD / Syokimau CFS / Compact CFS / NICT CFS / Michellcotts CFS";
export const RATE_TARIFF = "Rates adjusted tariff 15 May";

/** The terms printed under the card. Wording tidied, meaning unchanged. */
export const RATE_NOTES = [
  "The above rates are based on the current fuel price. In case of an unexpected increase, we will review them.",
  `All rates are subject to ${RATE_VAT_PERCENT}% VAT.`,
  "You will be responsible for any parking charges incurred.",
  "Any delay in offloading shall be charged.",
  "Any delay in pre-advice is also chargeable.",
  "Trucks will be allocated upon availability.",
  "Excess weight at the weighbridge is chargeable.",
];

/** [destination, rate in KES before VAT] */
export const STANDARD_RATES = [
  ["Airtel Area", 24700],
  ["75 Area", 26000],
  ["Kyangombe", 24700],
  ["Industrial Area", 28600],
  ["Road C", 26000],
  ["Tatu City", 36400],
  ["Ruiru", 36400],
  ["Cabanas", 23400],
  ["Syokimau SGR Road", 23400],
  ["Libra House", 23400],
  ["Kasarani", 35100],
  ["Masai Road Area", 23400],
  ["Signature Mall", 26000],
  ["Mlolongo", 32500],
  ["Kyangombe", 23400],
  ["Gilgil Road", 32500],
  ["Kitui Road", 32500],
  ["Lunga Lunga Road", 32500],
  ["JKIA", 28600],
  ["Embakasi", 26000],
  ["Karen", 32500],
  ["Ruaraka", 32500],
  ["Kabete", 32500],
  ["Limuru", 35100],
  ["Juja", 36400],
  ["Kitengela", 32100],
  ["Kiambu", 36400],
  ["Thika Town", 44200],
  ["Kileleshwa", 35100],
  ["Westlands", 35100],
  ["Babadogo", 35100],
  ["Machakos", 46800],
  ["Thindigua / Gigiri", 37700],
  ["Along Mombasa Road", 28600],
  ["Athi River", 30400],
  ["Naivasha", 74100],
  ["Mombasa - Nairobi", 142500],
  ["Nairobi-Mombasa Exports", 102700],
  ["Exports from Industrial Area", 32500],
  ["ICD-Ngong", 35100],
  ["ICD-Kisumu", 158200],
  ["Imara Mall Area", 24700],
  ["BAT-Baba Ndogo", 32500],
  ["ICD Likoni", 26000],
  ["ICD-Sagana", 58500],
  ["ICD-Lukenya", 49400],
  ["ICD-Konza", 49400],
];

/** The 16% VAT on a rate, and the rate with VAT included (whole shillings). */
export const vatOn = (amount) => Math.round((Number(amount) || 0) * RATE_VAT_PERCENT / 100);
export const withVat = (amount) => (Number(amount) || 0) + vatOn(amount);

/** The standard card as stored records. */
export const standardRates = () =>
  STANDARD_RATES.map(([destination, amount], i) => ({
    id: `rt${String(i + 1).padStart(2, "0")}`,
    destination,
    amount,
    order: i + 1,
    active: true,
  }));

/** Card order first, then anything staff add (which sorts to the end). */
export const sortRates = (rows) =>
  [...rows].sort((a, b) => (Number(a.order) || 1000) - (Number(b.order) || 1000) || String(a.destination).localeCompare(String(b.destination)));
