/* ============================================================
   Cloudflare Turnstile - the free "are you human" check shown on
   sign-in and sign-up. Set VITE_TURNSTILE_SITEKEY at build time to
   turn it on; leave it unset and this renders nothing (local dev,
   demo). The matching secret lives on the API as TURNSTILE_SECRET.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";

export const TURNSTILE_SITEKEY = import.meta.env?.VITE_TURNSTILE_SITEKEY || "";

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => {
      loading = null; // allow a retry on the next mount
      reject(new Error("The human check could not load."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** `onToken(token)` fires with the proof on success and with "" when it
    expires or fails. Bump `resetSignal` after each submit: a token works once. */
export function Turnstile({ onToken, resetSignal = 0 }) {
  const box = useRef(null);
  const widget = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return undefined;
    let cancelled = false;
    onToken("");
    loadScript()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widget.current = ts.render(box.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (widget.current != null && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetSignal && widget.current != null && window.turnstile) {
      onToken("");
      window.turnstile.reset(widget.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!TURNSTILE_SITEKEY) return null;
  if (failed) {
    return (
      <p className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
        The human check couldn't load. Check your connection and refresh the page.
      </p>
    );
  }
  return <div ref={box} className="flex justify-center" />;
}
