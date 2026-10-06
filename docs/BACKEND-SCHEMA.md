# KASH - Backend Schema

Storage: Workers KV, one key per collection, `data:<name>`, holding a JSON array. Shared with the ERP through `src/lib/schema.js`.

| Collection | Key fields | Notes |
|---|---|---|
| `users` | id, name, email, phone, role, division, status, passwordHash, termsAcceptedAt, termsVersion | status: Invited, Active, Suspended. `email:<address>` index maps to id |
| `trips` | id, date, vehicleId, driverId, origin, destination, distanceKm, amount, fuelCost, otherCost, status, createdBy | Income from fare, cost from fuel and tolls |
| `vehicles` | id, reg, type, model, driverId, status, mileage, serviceDueKm, insuranceExpiry | |
| `drivers` | id, name, idNumber, phone, email, licence, nextOfKin, status | |
| `maintenance` | id, date, vehicleId, category, description, cost | |
| `orders` | id, date, customer, channel, item, qty, unitPrice, amount, cost, paymentStatus, orderStatus, approval | Big orders carry an approval record |
| `menu` | id, name, category, price, cost, active | |
| `rooms` | id, number, property, type, price, status, floor | |
| `bookings` | id, guest, guestPhone, roomId, checkIn, checkOut, nights, amount, paid, paymentStatus, status | |
| `expenses` | id, date, division, category, vendor, amount, method, notes, approval | |
| `payments` | id, date, direction, amount, party, division, category, method, reference, status, createdBy | status Pending until M-Pesa confirmed |
| `approvals` | id, collection, recordId, division, summary, amount, status, by, role, at, note | Append-only, written only by the approve endpoint |
| `messages` | id, from, to, text, ts, read | `to` is a name or "Everyone" |
| `reminders` | id, title, due, division, priority, done | |
| `listings` | id, division, title, description, price, meta, imageUrl, active | Public via `GET /api/public/listings` (active only) |
| `company` | name, and profile fields | Single object |

Images: R2 keys `listings/<Division>/<id>.<ext>`, served at `/uploads/<key>`.

Relationships are by id: a trip points to a vehicle and driver; a booking to a room; an approval to a record. Deleting a user frees their email for re-invitation.

## Planned move to D1 (SQL)
The same tables become SQL tables with foreign keys and per-row updates, which removes the overwrite risk. Migration is planned, not started.
