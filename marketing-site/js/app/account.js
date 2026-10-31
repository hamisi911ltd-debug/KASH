'use strict';

const ACCOUNT_API = (((CFG.api && CFG.api.baseUrl) || '').replace(/\/+$/, '')) + '/api';
const ACCOUNT_REQUEST_TYPES = {
  enquiry:'Quote request',
  transport:'Transport request',
  ride:'Ride request',
  delivery:'Delivery request',
  booking:'Stay availability request',
  handoff:'Customer service request'
};

/* The API always answers in JSON. Anything else means the customer platform isn't
   connected (a static host answers /api/* with the home page or a bare 405), which
   must never be mistaken for a successful sign-in. */
async function accountJson(response){
  if (!(response.headers.get('content-type') || '').includes('application/json')){
    throw new Error('Customer accounts are not available yet. Please call or WhatsApp us and we will help you directly.');
  }
  return response.json().catch(() => ({}));
}

async function accountApi(path, options){
  const response = await fetch(ACCOUNT_API + path, Object.assign({
    credentials:'include',
    headers:{'Content-Type':'application/json'}
  }, options || {}));
  const body = await accountJson(response);
  if (!response.ok) throw new Error(body.error && body.error.message || 'We could not complete that. Please try again.');
  return body;
}

function accountError(form, message){
  const error = $('[data-account-error]', form);
  if (error){ error.textContent = message; error.hidden = false; }
}

function accountClearError(form){
  const error = $('[data-account-error]', form);
  if (error){ error.textContent = ''; error.hidden = true; }
}

function accountSetBusy(form, busy){
  const button = $('button[type="submit"]', form);
  if (!button) return;
  if (busy){
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Please wait…';
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml){
      button.innerHTML = form.dataset.account === 'reset' && form.dataset.resetStage === 'complete'
        ? 'Update password'
        : button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

function accountPasswordChecks(password, email){
  const emailName = (email || '').split('@')[0].toLowerCase();
  return {
    length: password.length >= 12,
    maximum: password.length <= 128,
    spaces: !(/^\s|\s$/.test(password)),
    common: !(/^(.)\1+$/.test(password) || /^(password|qwerty|letmein|welcome|admin|123456)/i.test(password)),
    email: !emailName || !password.toLowerCase().includes(emailName)
  };
}

function updateAccountPasswordValidation(form, revealErrors=false){
  const password = $('[data-new-password]', form);
  if (!password) return true;
  const email = $('[name="email"]', form);
  const checks = accountPasswordChecks(password.value, email && email.value);
  const policy = $('[data-password-policy]', form);
  if (policy){
    const showStatus = revealErrors || password.value.length > 0;
    Object.entries(checks).forEach(([rule, valid]) => {
      const item = $(`[data-password-rule="${rule}"]`, policy);
      if (!item) return;
      item.classList.toggle('is-valid', valid && showStatus);
      item.classList.toggle('is-invalid', !valid && showStatus);
    });
  }
  const messages = {
    length:'Use a password with at least 12 characters.',
    maximum:'Password must be no more than 128 characters.',
    spaces:'Password cannot start or end with a space.',
    common:'Choose a less common password.',
    email:'Do not include your email name in your password.'
  };
  const failedRule = Object.keys(checks).find((rule) => !checks[rule]);
  password.setCustomValidity(failedRule ? messages[failedRule] : '');

  const confirmation = $('[data-confirm-for]', form);
  if (confirmation){
    const mismatch = Boolean(confirmation.value && password.value !== confirmation.value);
    confirmation.setCustomValidity(mismatch ? 'Passwords do not match.' : '');
  }
  return !failedRule && (!confirmation || !confirmation.value || password.value === confirmation.value);
}

async function submitAccountForm(form){
  const action = form.dataset.account;
  const data = Object.fromEntries(new FormData(form).entries());
  accountClearError(form);

  if (action === 'reset' && !form.dataset.resetStage){
    if (!form.reportValidity()) return;
    accountSetBusy(form, true);
    try {
      await accountApi('/auth/password-reset', {method:'POST', body:JSON.stringify({email:data.email})});
      form.dataset.resetStage = 'complete';
      const resetFields = $('[data-reset-complete]', form);
      resetFields.hidden = false;
      $$('input', resetFields).forEach((input) => { input.disabled = false; });
      $('[data-reset-button]', form).textContent = 'Update password';
      toast('If an account exists, a reset code has been sent.');
    } catch (error){ accountError(form, error.message); }
    finally { accountSetBusy(form, false); }
    return;
  }

  if (action === 'register' || (action === 'reset' && form.dataset.resetStage === 'complete')){
    updateAccountPasswordValidation(form, true);
  }
  if (!form.reportValidity()) return;
  accountSetBusy(form, true);
  try {
    if (action === 'register'){
      await accountApi('/auth/register', {method:'POST', body:JSON.stringify({name:data.name, email:data.email, password:data.password})});
      location.hash = '#/account/verify';
    } else if (action === 'verify'){
      await accountApi('/auth/verify', {method:'POST', body:JSON.stringify({email:data.email, code:data.code})});
      location.hash = '#/account/dashboard';
    } else if (action === 'login'){
      await accountApi('/auth/login', {method:'POST', body:JSON.stringify({email:data.email, password:data.password})});
      let reviewReturn = false;
      try { reviewReturn = sessionStorage.getItem('kash-review-return') === '1'; sessionStorage.removeItem('kash-review-return'); } catch (error){ console.error('Could not restore the review page after sign-in.', error); }
      location.hash = reviewReturn ? '#/account/reviews' : '#/account/dashboard';
    } else if (action === 'reset'){
      await accountApi('/auth/password-reset/complete', {method:'POST', body:JSON.stringify({email:data.email, code:data.code, password:data.password})});
      toast('Password updated. Please sign in.');
      location.hash = '#/account/login';
    }
  } catch (error){ accountError(form, error.message); }
  finally { accountSetBusy(form, false); }
}

async function loadAccountReviews(){
  const root = $('[data-account-reviews]');
  if (!root) return;
  const errorBox = $('[data-account-error]');
  try {
    const result = await accountApi('/account/reviews');
    const requests = result.requests || [];
    if (!requests.length){
      root.innerHTML = '<p class="account-empty">There are no completed KASH requests available to review yet. Once a request is marked completed, you can rate it here.</p>';
      return;
    }
    root.innerHTML = `<div class="review-request-list">${requests.map((request) => {
      const label = ACCOUNT_REQUEST_TYPES[request.type] || 'KASH service';
      if (request.review_id) return `<article class="review-request"><div><h2>${esc(label)}</h2><p class="review-state">Review ${esc(request.review_status)}</p></div></article>`;
      return `<article class="review-request">
        <div><h2>${esc(label)}</h2><p class="review-date">Completed ${esc(new Date(request.created_at).toLocaleDateString('en-KE'))}</p></div>
        <form class="review-form" data-review-request="${esc(request.id)}">
          <fieldset class="review-rating"><legend>Your rating</legend>
            ${[1,2,3,4,5].map((rating) => `<label><input type="radio" name="rating" value="${rating}" required><span aria-label="${rating} ${rating === 1 ? 'star' : 'stars'}">${'★'.repeat(rating)}</span></label>`).join('')}
          </fieldset>
          <label class="review-label">Your review
            <textarea name="review" rows="4" minlength="10" maxlength="1000" required placeholder="Tell us about your KASH experience (10–1,000 characters)."></textarea>
          </label>
          <button class="btn btn-amber" type="submit">Send review</button>
        </form>
      </article>`;
    }).join('')}</div>`;
  } catch (error){
    root.textContent = '';
    if (errorBox){ errorBox.textContent = error.message; errorBox.hidden = false; }
    if (error.message.includes('sign in')){
      try { sessionStorage.setItem('kash-review-return', '1'); } catch (storageError){ console.error('Could not save the review page return path.', storageError); }
      location.hash = '#/account/login';
    }
  }
}

async function submitCustomerReview(form){
  const requestId = form.dataset.reviewRequest;
  const rating = Number(new FormData(form).get('rating'));
  const review = new FormData(form).get('review');
  const button = $('button[type="submit"]', form);
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    const result = await accountApi(`/account/requests/${encodeURIComponent(requestId)}/review`, {
      method:'POST',
      body:JSON.stringify({rating, review})
    });
    toast(result.message || 'Your review was submitted for approval.');
    await loadAccountReviews();
  } catch (error){
    accountError(form.closest('.account-card'), error.message);
    button.disabled = false;
    button.textContent = 'Send review';
  }
}

async function loadPublicReviews(){
  const root = $('[data-public-reviews]');
  if (!root) return;
  if (!CFG.api.baseUrl){
    root.textContent = 'Customer reviews will appear here after the KASH customer platform is connected.';
    return;
  }
  try {
    const result = await accountApi('/reviews');
    const reviews = result.reviews || [];
    if (!reviews.length){
      root.textContent = 'No published reviews yet. Completed-service reviews will appear here after KASH approves them.';
      return;
    }
    root.innerHTML = reviews.map((review) => `<article class="public-review">
      <div class="public-review-stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}<span>${'★'.repeat(5 - review.rating)}</span></div>
      <p>${esc(review.body)}</p><small>Verified KASH customer · ${esc(new Date(review.created_at).toLocaleDateString('en-KE'))}</small>
    </article>`).join('');
  } catch (error){
    root.textContent = 'Customer reviews are temporarily unavailable. Please try again later.';
    console.error('Could not load published customer reviews.', error);
  }
}

async function loadAccountDashboard(){
  const root = $('[data-account-profile]');
  if (!root) return;
  const error = $('[data-account-error]');
  try {
    const [account, history] = await Promise.all([
      accountApi('/account'),
      accountApi('/account/requests')
    ]);
    root.textContent = `${account.customer.name} · ${account.customer.email}`;
    const box = $('[data-account-requests]');
    const requests = history.requests || [];
    box.innerHTML = requests.length ? `<h2>Your requests</h2><ul>${requests.map((item) =>
      `<li><span><b>${esc(ACCOUNT_REQUEST_TYPES[item.type] || 'Service request')}</b><small>${esc(new Date(item.created_at).toLocaleDateString('en-KE'))}</small></span><span class="account-status">${esc(item.status.replace(/_/g, ' '))}</span></li>`
    ).join('')}</ul>` : '<p>You have no requests linked to this account yet. You can still browse services and request a quote.</p>';
  } catch (failure){
    if (error){ error.textContent = failure.message; error.hidden = false; }
    if (failure.message.includes('sign in')) setTimeout(() => { location.hash = '#/account/login'; }, 1000);
  }
}

document.addEventListener('submit', (event) => {
  const reviewForm = event.target.closest('form[data-review-request]');
  if (reviewForm){
    event.preventDefault();
    submitCustomerReview(reviewForm);
    return;
  }
  const form = event.target.closest('form[data-account]');
  if (!form) return;
  event.preventDefault();
  submitAccountForm(form);
});

document.addEventListener('input', (event) => {
  const form = event.target.closest('form[data-account]');
  if (!form || !event.target.matches('[data-new-password],[data-confirm-for],[name="email"]')) return;
  updateAccountPasswordValidation(form);
});

document.addEventListener('click', async (event) => {
  const passwordToggle = event.target.closest('[data-password-toggle]');
  if (passwordToggle){
    const input = document.getElementById(passwordToggle.dataset.passwordToggle);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(visible));
    const fieldLabel = $('label', input.closest('.field'));
    const labelText = fieldLabel ? fieldLabel.textContent.trim().replace(/\s*\*$/, '') : input.getAttribute('aria-label') || input.name;
    passwordToggle.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${labelText}`);
    passwordToggle.innerHTML = ico(visible ? 'eyeOff' : 'eye');
    input.focus();
    return;
  }

  const googleButton = event.target.closest('[data-google-signin]');
  if (googleButton){
    const error = $('[data-google-error]');
    const baseUrl = ((CFG.api && CFG.api.baseUrl) || '').replace(/\/+$/, '');
    if (!baseUrl){
      error.textContent = 'Google sign-in will be available after the KASH backend and Google connection are configured.';
      error.hidden = false;
      return;
    }
    location.assign(baseUrl + '/api/auth/google');
    return;
  }

  const button = event.target.closest('[data-account-logout]');
  if (!button) return;
  button.disabled = true;
  try {
    await accountApi('/auth/logout', {method:'POST', body:'{}'});
    location.hash = '#/account/login';
  } catch (error){
    const message = $('[data-account-error]');
    if (message){ message.textContent = error.message; message.hidden = false; }
    button.disabled = false;
  }
});
