'use strict';

const STAFF_STATUSES = ['received', 'reviewing', 'confirmed', 'in_progress', 'completed', 'cancelled'];

async function loadStaffRequests(){
  const root = $('[data-staff-requests]');
  if (!root) return;
  const errorBox = $('[data-staff-error]');
  const status = $('[data-staff-filter]')?.value || '';
  root.textContent = 'Loading requests…';
  try {
    const query = status ? '?status=' + encodeURIComponent(status) : '';
    const response = await fetch('/api/staff/requests' + query, {credentials:'same-origin'});
    const body = await accountJson(response);
    if (!response.ok) throw new Error(body.error && body.error.message || 'Staff access could not be confirmed. Check your Cloudflare Access sign-in.');
    const rows = body.requests || [];
    if (!rows.length){ root.innerHTML = '<p class="account-empty">No requests in this view.</p>'; return; }
    root.innerHTML = `<div class="staff-list">${rows.map((item) => {
      let payload = {};
      try { payload = JSON.parse(item.payload_json); } catch (error){ console.error('Could not read a stored request.', error); }
      const details = Object.entries(payload).map(([key, value]) => {
        const display = typeof value === 'string' ? value : JSON.stringify(value);
        return `<div><dt>${esc(key.replace(/([A-Z])/g, ' $1'))}</dt><dd>${esc(display)}</dd></div>`;
      }).join('');
      return `<article class="staff-request">
        <div class="staff-request-head"><div><b>${esc(item.type.replace(/_/g, ' '))}</b><small>${esc(new Date(item.created_at).toLocaleString('en-KE'))}</small></div>
          <label>Status<select data-request-status="${esc(item.id)}">${STAFF_STATUSES.map((value) => `<option value="${value}" ${value === item.status ? 'selected' : ''}>${esc(value.replace(/_/g, ' '))}</option>`).join('')}</select></label></div>
        <details><summary>Request details</summary><dl>${details || '<div><dd>No details recorded.</dd></div>'}</dl></details>
      </article>`;
    }).join('')}</div>`;
  } catch (error){
    root.textContent = '';
    if (errorBox){ errorBox.textContent = error.message; errorBox.hidden = false; }
  }
}

document.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-request-status]');
  if (!select) return;
  select.disabled = true;
  try {
    const response = await fetch('/api/staff/requests/' + encodeURIComponent(select.dataset.requestStatus), {
      method:'PATCH',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:select.value})
    });
    const body = await accountJson(response);
    if (!response.ok) throw new Error(body.error && body.error.message || 'Could not update the request.');
    toast('Request status updated.');
    await loadStaffRequests();
  } catch (error){
    const box = $('[data-staff-error]');
    if (box){ box.textContent = error.message; box.hidden = false; }
    select.disabled = false;
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-staff-filter]')) loadStaffRequests();
});
