/* =========================================================
   KASH - js/data/rates.js
   The Transport rate card: container trucking from the Nairobi
   ICD / CFS depots. This is the built-in copy, shown if the KASH ERP
   can't be reached. When staff publish rates in the ERP (Rate card page)
   js/core/erp.js swaps these for the live ones.
   Keep it in step with src/lib/rates.js (a test checks they match).
========================================================= */
'use strict';

const RATE_ROWS = [
  ['Airtel Area', 24700], ['75 Area', 26000], ['Kyangombe', 24700], ['Industrial Area', 28600], ['Road C', 26000],
  ['Tatu City', 36400], ['Ruiru', 36400], ['Cabanas', 23400], ['Syokimau SGR Road', 23400], ['Libra House', 23400],
  ['Kasarani', 35100], ['Masai Road Area', 23400], ['Signature Mall', 26000], ['Mlolongo', 32500], ['Kyangombe', 23400],
  ['Gilgil Road', 32500], ['Kitui Road', 32500], ['Lunga Lunga Road', 32500], ['JKIA', 28600], ['Embakasi', 26000],
  ['Karen', 32500], ['Ruaraka', 32500], ['Kabete', 32500], ['Limuru', 35100], ['Juja', 36400],
  ['Kitengela', 32100], ['Kiambu', 36400], ['Thika Town', 44200], ['Kileleshwa', 35100], ['Westlands', 35100],
  ['Babadogo', 35100], ['Machakos', 46800], ['Thindigua / Gigiri', 37700], ['Along Mombasa Road', 28600], ['Athi River', 30400],
  ['Naivasha', 74100], ['Mombasa - Nairobi', 142500], ['Nairobi-Mombasa Exports', 102700], ['Exports from Industrial Area', 32500], ['ICD-Ngong', 35100],
  ['ICD-Kisumu', 158200], ['Imara Mall Area', 24700], ['BAT-Baba Ndogo', 32500], ['ICD Likoni', 26000], ['ICD-Sagana', 58500],
  ['ICD-Lukenya', 49400], ['ICD-Konza', 49400]
];
const RATE_CARD = {
  vat: 16,
  origin: 'ICD / Syokimau CFS / Compact CFS / NICT CFS / Michellcotts CFS',
  tariff: 'Rates adjusted tariff 15 May',
  notes: [
    'The above rates are based on the current fuel price. In case of an unexpected increase, we will review them.',
    'All rates are subject to 16% VAT.',
    'You will be responsible for any parking charges incurred.',
    'Any delay in offloading shall be charged.',
    'Any delay in pre-advice is also chargeable.',
    'Trucks will be allocated upon availability.',
    'Excess weight at the weighbridge is chargeable.'
  ],
  rates: RATE_ROWS.map(([to, kes], i) => ({id:'rt' + String(i + 1).padStart(2, '0'), to, kes}))
};
const rateVat = (kes) => Math.round(kes * RATE_CARD.vat / 100);
const rateWithVat = (kes) => kes + rateVat(kes);
const rateFind = (id) => RATE_CARD.rates.find((r) => r.id === id);
const rateByName = (name) => RATE_CARD.rates.find((r) => r.to.toLowerCase() === String(name || '').trim().toLowerCase());
