'use strict';

function accountFrame(title, intro, content){
  return `<section class="section account-section"><div class="account-card">
    <a class="account-brand" href="#/" aria-label="KASH General Suppliers home">
      <img src="images/logo.webp" alt="KASH General Suppliers" width="140" height="54">
    </a>
    <div class="account-heading"><h1>${title}</h1><p>${intro}</p></div>
    ${content}
  </div></section>`;
}

function accountPage(view){
  if (view === 'register') return accountFrame('Create your account', 'Register with KASH to keep your service requests together.', `
    <form class="form account-form" data-account="register" novalidate>
      ${field({label:'Your name', name:'name', req:true, ac:'name', id:'account_name'})}
      ${field({label:'Email address', name:'email', type:'email', req:true, ac:'email', id:'account_email'})}
      ${accountPasswordField({label:'Password', name:'password', id:'account_password', autocomplete:'new-password'})}
      ${passwordPolicyHtml()}
      ${accountPasswordField({label:'Confirm password', name:'confirmPassword', id:'account_password_confirm', autocomplete:'new-password', confirmFor:'account_password'})}
      <div class="account-error" data-account-error role="alert" hidden></div>
      <button class="btn btn-amber btn-block" type="submit">Create account</button>
      <p class="account-switch">Already registered? <a href="#/account/login">Sign in</a></p>
    </form>`);

  if (view === 'verify') return accountFrame('Check your email', 'Enter the six-digit verification code we sent you. The code expires in 10 minutes.', `
    <form class="form account-form" data-account="verify" novalidate>
      ${field({label:'Email address', name:'email', type:'email', req:true, ac:'email', id:'verify_email'})}
      ${field({label:'Verification code', name:'code', type:'text', req:true, ac:'one-time-code', id:'account_code', attrs:'inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"'})}
      <div class="account-error" data-account-error role="alert" hidden></div>
      <button class="btn btn-amber btn-block" type="submit">Verify email</button>
      <p class="account-switch"><a href="#/account/register">Back to registration</a></p>
    </form>`);

  if (view === 'reset') return accountFrame('Reset your password', 'We will email you a time-limited code to reset your password.', `
    <form class="form account-form" data-account="reset" novalidate>
      ${field({label:'Email address', name:'email', type:'email', req:true, ac:'email', id:'reset_email'})}
      <div data-reset-complete hidden>
        ${field({label:'Six-digit code', name:'code', type:'text', req:true, ac:'one-time-code', id:'reset_code', attrs:'inputmode="numeric" pattern="[0-9]{6}" maxlength="6" disabled'})}
        ${accountPasswordField({label:'New password', name:'password', id:'reset_password', autocomplete:'new-password', disabled:true})}
        ${passwordPolicyHtml()}
        ${accountPasswordField({label:'Confirm new password', name:'confirmPassword', id:'reset_password_confirm', autocomplete:'new-password', confirmFor:'reset_password', disabled:true})}
      </div>
      <div class="account-error" data-account-error role="alert" hidden></div>
      <button class="btn btn-amber btn-block" type="submit" data-reset-button>Send reset code</button>
      <p class="account-switch"><a href="#/account/login">Back to sign in</a></p>
    </form>`);

  return `<section class="section account-section login-section">
    <div class="login-layout">
      <aside class="login-story">
        <span class="login-kicker">KASH CUSTOMER PORTAL</span>
        <h1>Good to have you back.</h1>
        <p>One secure place to follow your requests and stay connected with KASH.</p>
        <div class="login-highlights">
          <span>${ico('check')} Keep your service requests together</span>
          <span>${ico('check')} See the latest request updates</span>
          <span>${ico('check')} Sign in securely, wherever you are</span>
        </div>
        <div class="login-story-footer">KASH General Suppliers <span>·</span> Kenya</div>
      </aside>
      <div class="account-card login-card">
        <a class="account-brand" href="#/" aria-label="KASH General Suppliers home">
          <img src="images/logo.webp" alt="KASH General Suppliers" width="140" height="54">
        </a>
        <div class="account-heading">
          <span class="login-eyebrow">CUSTOMER SIGN IN</span>
          <h2>Welcome back</h2>
          <p>Enter your details to access your account.</p>
        </div>
        <form class="form account-form" data-account="login" novalidate>
          ${field({label:'Email address', name:'email', type:'email', req:true, ac:'email', id:'login_email'})}
          <div class="field login-password-field">
            <div class="login-password-label"><label for="login_password">Password</label><a href="#/account/reset">Forgot password?</a></div>
            <div class="password-input-wrap">
              <input id="login_password" name="password" type="password" required autocomplete="current-password" maxlength="128" aria-label="Password">
              <button class="password-toggle" type="button" data-password-toggle="login_password" aria-label="Show password" aria-pressed="false">${ico('eye')}</button>
            </div>
            <span class="err">This field is required.</span>
          </div>
          <div class="account-error" data-account-error role="alert" hidden></div>
          <button class="btn btn-amber btn-block login-submit" type="submit">Sign in</button>
        </form>
        <div class="login-divider"><span>or continue with</span></div>
        <div class="account-error google-signin-error" data-google-error role="alert" ${/(?:[?&])google_error=1(?:&|$)/.test(location.hash) ? '' : 'hidden'}>Google sign-in was not completed. Please try again or sign in with your email and password.</div>
        <button class="google-signin" type="button" data-google-signin>
          ${ico('google')}<span>Continue with Google</span>
        </button>
        <p class="account-switch login-register">New to KASH? <a href="#/account/register">Create an account</a></p>
        <p class="login-security">${ico('lock')} Your sign-in is protected</p>
      </div>
    </div>
  </section>`;
}

function accountPasswordField({label, name, id, autocomplete, confirmFor, disabled=false}){
  return `<div class="field account-password-field">
    <label for="${id}">${label} <span class="req">*</span></label>
    <div class="password-input-wrap">
      <input id="${id}" name="${name}" type="password" required autocomplete="${autocomplete}" minlength="12" maxlength="128" ${disabled ? 'disabled' : ''} ${confirmFor ? `data-confirm-for="${confirmFor}"` : 'data-new-password'}>
      <button class="password-toggle" type="button" data-password-toggle="${id}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">${ico('eye')}</button>
    </div>
    <span class="err">This field is required.</span>
  </div>`;
}

function passwordPolicyHtml(){
  return `<ul class="password-policy" data-password-policy aria-label="Password requirements">
    <li data-password-rule="length">${ico('check')}At least 12 characters</li>
    <li data-password-rule="maximum">${ico('check')}No more than 128 characters</li>
    <li data-password-rule="spaces">${ico('check')}No spaces at the beginning or end</li>
    <li data-password-rule="common">${ico('check')}Not a common or repeated password</li>
    <li data-password-rule="email">${ico('check')}Does not contain your email name</li>
  </ul>`;
}

function accountDashboard(){
  return accountFrame('Your KASH account', 'Your requests and their latest status.', `
    <div class="account-error" data-account-error role="alert" hidden></div>
    <div class="account-profile" data-account-profile aria-live="polite">Loading your account…</div>
    <div class="account-requests" data-account-requests></div>
    <button class="btn btn-outline btn-block" type="button" data-account-logout>Sign out</button>`);
}

function accountReviewsPage(){
  return accountFrame('Your completed KASH requests', 'Leave a rating and review after KASH has completed your service. Reviews are checked by our team before they appear publicly.', `
    <div class="account-error" data-account-error role="alert" hidden></div>
    <div class="account-requests" data-account-reviews aria-live="polite">Loading your completed requests…</div>
    <p class="account-switch"><a href="#/account/dashboard">Back to your account</a></p>`);
}

function pageAccount(view){
  if (view === 'register' || view === 'verify' || view === 'reset') return accountPage(view);
  if (view === 'dashboard') return accountDashboard();
  if (view === 'reviews') return accountReviewsPage();
  return accountPage('login');
}
