/* =========================================================
   KASH - js/core/backend.js
   Saves form submissions: Supabase, or demo mode.
========================================================= */
'use strict';

/* Every form on the site ends up here. The request is saved in this order:
     1. Our API (backend/) - when api.baseUrl is set in js/config.js. This is the real thing.
     2. Demo mode - saved in this visitor's own browser only (nobody receives it)
   `type` is one of: enquiry | transport | ride | delivery | booking | handoff
   Returns {ok, mode, message?}  mode: live | demo | busy | invalid | error */
async function submitRequest(type, data){
  const api = ((CFG.api && CFG.api.baseUrl) || '').replace(/\/+$/, '');
  const record = {type, data, created_at:new Date().toISOString()};

  const erp = ((CFG.api && CFG.api.erpUrl) || '').replace(/\/+$/, '');
  if (erp){
    try {
      const res = await fetch(erp + '/api/public/requests', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type, data})
      });
      if (res.status === 429) return {ok:false, mode:'busy', message:'Too many requests from your connection. Please wait a few minutes and try again, or contact us on WhatsApp.'};
      if (res.status === 422){
        const body = await res.json().catch(() => ({}));
        return {ok:false, mode:'invalid', message:body.error || 'Please check your name and phone number and try again.'};
      }
      if (!res.ok) throw new Error('ERP responded ' + res.status);
      return {ok:true, mode:'live'};
    } catch (err) { console.error(err); saveLocal(record); return {ok:false, mode:'error'}; }
  }
  if (api){
    try {
      const res = await fetch(api + '/api/requests', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({type, data})
      });
      if (res.status === 429) return {ok:false, mode:'busy', message:'Too many requests from your connection. Please wait a few minutes and try again, or contact us on WhatsApp.'};
      if (res.status === 422){
        const body = await res.json().catch(() => ({}));
        return {ok:false, mode:'invalid', message:(body.error && body.error.message) || 'Please check your details and try again.'};
      }
      if (!res.ok) throw new Error('API responded ' + res.status);
      return {ok:true, mode:'live'};
    } catch (err) { console.error(err); saveLocal(record); return {ok:false, mode:'error'}; }
  }
  saveLocal(record);
  return {ok:true, mode:'demo'};
}
function saveLocal(r){
  try { const l = JSON.parse(localStorage.getItem('kash_requests') || '[]'); l.push(r); localStorage.setItem('kash_requests', JSON.stringify(l)); } catch (e) {}
}
