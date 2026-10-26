/* =========================================================
   KASH - js/core/cart.js
   The visitor's quote list (kept in their own browser).
========================================================= */
'use strict';

let cart = [];
try { cart = JSON.parse(localStorage.getItem('kash_cart') || '[]'); } catch (e) { cart = []; }
const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);

function saveCart(){
  try { localStorage.setItem('kash_cart', JSON.stringify(cart)); } catch (e) {}
  updateChrome();
}
const priceHtml = (p) => p.price ? `From KES ${money(p.price)} <small>/ ${p.unit}</small>` : `<span class="ask">Ask for today's price</span>`;
const cartTotal = () => cart.reduce((s, i) => s + (i.price ? i.qty * i.price : 0), 0);
function addToCart(id){
  const p = PRODUCTS.find((x) => x.id === id); if (!p) return;
  const f = cart.find((x) => x.id === id);
  if (f) f.qty += 1; else cart.push({id:p.id, name:p.name, unit:p.unit, price:p.price, img:p.img, qty:1});
  saveCart();
  toast(`${p.name} added to your quote`);
}
function changeQty(id, d){
  const it = cart.find((x) => x.id === id); if (!it) return;
  it.qty += d; if (it.qty <= 0) cart = cart.filter((x) => x.id !== id);
  saveCart(); render(true);
}
function removeItem(id){ cart = cart.filter((x) => x.id !== id); saveCart(); render(true); }
