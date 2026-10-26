/* =========================================================
   KASH - js/pages/food.js
   Agro & food page and the Products page.
========================================================= */
'use strict';

let productFilter = 'All', productSearch = '';
function productCard(p){
  return `<div class="cardx acc-teal">${media({img:p.img, alt:p.name, icon:(PRODUCT_CATEGORIES.find((c) => c.key === p.category) || {}).icon || 'leaf', tag:p.tag, accent:'teal'})}
    <div class="body"><h3>${p.name}</h3><p>${p.desc}</p><div class="price mt-8">${priceHtml(p)}</div></div>
    <div class="cfoot"><button class="btn btn-outline btn-sm btn-block" data-add="${p.id}">${ico('plus')} Add to quote</button></div></div>`;
}
function filteredProducts(){
  const q = productSearch.trim().toLowerCase();
  return PRODUCTS.filter((p) => (productFilter === 'All' || p.category === productFilter) && (!q || (p.name + ' ' + p.tag + ' ' + p.desc).toLowerCase().indexOf(q) > -1));
}
function prodGridHtml(){
  const l = filteredProducts();
  return l.length ? l.map(productCard).join('') : `<div class="empty">${ico('search')}<p>No products match your search.</p><button class="btn btn-navy btn-sm" data-reset-prod style="margin-top:12px">Show all products</button></div>`;
}
function pageAgro(){
  const cats = PRODUCT_CATEGORIES.map((c, i) => `<a class="feat" href="#/products/${c.key}"><div class="badge ${['c-teal', 'c-blue', 'c-amber', 'c-red'][i % 4]}">${ico(c.icon)}</div><h3>${c.label}</h3><span class="go">Browse</span></a>`).join('');
  return heroPage({accent:'teal', crumbs:[['Services', '#/services'], ['Agro & food']], title:'From our farms to your table.',
    lead:'Fresh chicken, eggs, beef and goat meat for homes, restaurants, hotels and butcheries.',
    actions:'<a class="btn btn-amber" href="#/products">Shop products</a><a class="btn btn-ghost" href="#/quote/Agro%20%26%20Food">Get a quote</a>',
    card:slideCard(PAGE_SLIDES.agro)}) + `
  <section class="section pt-20"><div class="wrap">${secHead('Shop by category', 'Chicken, beef, goat and eggs. More coming soon.', 'Agro & food')}<div class="grid g4 agro-categories">${cats}</div></div></section>
  <section class="section products"><div class="wrap">
    <div class="section-head"><div><h2>Popular products</h2><p class="lede">Fresh. Safe. Quality guaranteed.</p></div><a class="link-arrow" href="#/products">See all</a></div>
    <div class="grid g3">${HOME_PRODUCT_IDS.map((id) => productCard(PRODUCTS.find((x) => x.id === id))).join('')}</div></div></section>
  <section class="section"><div class="wrap">${secHead('Who we supply', '', 'For every buyer')}${featTiles(AGRO_WHO)}</div></section>
  <section class="section alt"><div class="wrap">${secHead('How ordering works', 'From catalogue to your door.', 'Simple process')}${steps(AGRO_STEPS)}</div></section>
  <section class="section"><div class="wrap split"><div>${secHead('What you can expect from every order', '', 'Our promise')}${checks(AGRO_PROMISES)}</div>
    <div><h2 class="sm mb-16">Ordering questions</h2>${faq(FAQS.agro)}</div></div></section>
  <section class="section pt-0"><div class="wrap">${ctaBand('Need a regular supply?', 'Tell us what you buy and how often, and we will build a plan around it.', 'Get a quote', '#/quote/Agro%20%26%20Food')}</div></section>`;
}
function pageProducts(){
  const cats = ['All'].concat(PRODUCT_CATEGORIES.map((c) => c.key));
  const label = (k) => k === 'All' ? 'All' : PRODUCT_CATEGORIES.find((c) => c.key === k).label;
  return heroPage({accent:'teal', crumbs:[['Agro & food', '#/agro'], ['Products']], title:'Featured products.', lead:'Fresh chicken, beef, goat meat and eggs. Add what you need to your quote and we will confirm today\'s price.',
    actions: cart.length ? `<a class="btn btn-amber" href="#/quote">Review quote (${cartCount()})</a>` : '',
    card:slideCard(PAGE_SLIDES.products)}) + `
  <section class="section pt-20"><div class="wrap">
    <div class="toolbar"><div class="searchbox">${ico('search')}<input id="prodSearch" type="search" placeholder="Search products..." value="${esc(productSearch)}" aria-label="Search products"></div></div>
    <div class="chips" id="prodChips" role="group" aria-label="Filter by category" style="margin-bottom:26px">${cats.map((c) => `<button type="button" data-pcat="${c}" class="${c === productFilter ? 'on' : ''}" aria-pressed="${c === productFilter}">${label(c)}</button>`).join('')}</div>
    <div class="grid g4" id="prodGrid">${prodGridHtml()}</div>
    <div class="note-box mt-28">${ico('info')}<span>Meat and egg prices move with the market. We confirm today's price in your quote.</span></div>
  </div></section>`;
}
