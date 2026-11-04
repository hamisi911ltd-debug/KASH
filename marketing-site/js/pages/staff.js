'use strict';

function pageStaff(){
  return `<section class="section account-section"><div class="staff-wrap">
    <a class="account-brand" href="#/" aria-label="KASH General Suppliers home"><img src="images/logo.webp" alt="KASH General Suppliers" width="140" height="54"></a>
    <div class="account-heading"><h1>Staff requests</h1><p>Private request queue. Sign in through your company’s Cloudflare Access account.</p></div>
    <div class="account-error" data-staff-error role="alert" hidden></div>
    <label class="staff-filter">Filter by status
      <select data-staff-filter>
        <option value="">All requests</option>
        <option value="received">Received</option>
        <option value="reviewing">Reviewing</option>
        <option value="confirmed">Confirmed</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </label>
    <div data-staff-requests aria-live="polite">Loading requests…</div>
    <section class="staff-reviews">
      <div class="account-heading"><h2>Customer reviews</h2><p>Approve reviews to publish them on the public website, or reject them.</p></div>
      <div class="account-error" data-staff-review-error role="alert" hidden></div>
      <div data-staff-reviews aria-live="polite">Loading customer reviews…</div>
    </section>
  </div></section>`;
}
