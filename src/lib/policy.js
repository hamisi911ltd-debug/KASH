/* ============================================================
   Account rules shared by the sign-up form (browser) and the API
   (Worker), so both always agree. Pure JS, no React/DOM.
   ============================================================ */

/** Returns a message fit to show the person, or null when the password is fine. */
export function passwordProblem(password, email = "") {
  const pw = String(password || "");
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 200) return "Password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password needs at least one letter and one number.";
  if (email && pw.toLowerCase() === String(email).toLowerCase()) return "Password can't be the same as your email.";
  return null;
}

/** Stored on every new account so we can prove which version of the Terms and
    Privacy Policy someone accepted. Bump it whenever those documents change. */
export const TERMS_VERSION = "2026-09";

/** Minimum age to hold an account. */
export const MIN_AGE = 18;
