/* =========================================================
   KASH - js/config.js   (edit this file first)
   Nothing secret belongs here: everything in this file is visible
   to anyone who opens the website. Secrets live on the server.
========================================================= */
window.KASH_CONFIG = {

  /* ---- Business contact details (shown across the site) ---- */
  business: {
    phoneDisplay: "+254142426451",
    phoneTel:     "+254142426451",
    whatsapp:     "254142426451",
    email:        "info@kashgeneralsuppliers.com",
    location:     "Nairobi, Kenya",
    hours:        "Mon to Sat, 8AM to 6PM",
    /* Where your cars start from. Used for the "how far is the car" estimate.
       Right-click your base in Google Maps and copy the two numbers. (Placeholder = Nairobi centre) */
    base: {lat:-1.2921, lng:36.8219, label:"KASH base, Nairobi"},
    /* Optional: paste the Google Maps "Share" link of your exact premises. Used by the location link and the Contact page map. */
    mapUrl: ""
  },

  /* ---- Official social media profiles: paste each full https:// profile URL ----
     Blank entries currently open that platform's homepage. Replace with KASH's profile once
     each account exists. Links are checked against each platform's official domain.
     Example:  facebook: "https://www.facebook.com/your.page"  */
  social: {
    facebook:  "",
    instagram: "",
    x:         "",
    youtube:   "",
    linkedin:  ""
  },

  /* ---- The server (backend/) that receives requests ----
     baseUrl is the address of your deployed API, for example "https://api.kash.co.ke".
     For Cloudflare production, route /api/* on the same site domain to the Worker and set
     baseUrl to window.location.origin. Leave it empty for DEMO MODE: requests stay in the
     visitor's browser and nobody at KASH receives them. See backend/README.md. */
  api: {
    baseUrl: "",
    /* The KASH ERP's public API: quote, ride, delivery and booking forms are saved here
       (staff see them on the ERP's Website page) and the Products and Stays pages show
       whatever is published there. */
    erpUrl: "https://kash-api-live.johndrekuz.workers.dev"
  },

  /* ---- Chat assistant (the robot button, bottom right) ----
     Set enabled:false to hide it. Its wording lives in js/assistant/assistant-data.js.
     endpoint is optional: a URL of your own AI service. Leave blank to use the built-in
     guided answers. See docs/PROJECT_GUIDE.md ("Connecting a real AI"). */
  assistant: {
    enabled:  true,
    name:     "KASH Assistant",
    endpoint: ""
  }
};
