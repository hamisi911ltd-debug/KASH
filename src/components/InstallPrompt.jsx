/* Offers to install KASH ERP as an app: a nice pop-up on Android and desktop Chrome/Edge,
   and a how-to on iPhone. Appears once in a while, never when already installed. */
import React, { useEffect, useRef, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { C } from "../lib/constants";
import { KashLogo } from "./Logo.jsx";

const KEY = "kash-erp-install-dismissed";
const WAIT_DAYS = 14;
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const recentlyDismissed = () => { try { return Date.now() - (Number(localStorage.getItem(KEY)) || 0) < WAIT_DAYS * 864e5; } catch { return false; } };
const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ } };
const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

export default function InstallPrompt() {
  const [kind, setKind] = useState(null); // "prompt" | "ios" | null
  const [visible, setVisible] = useState(false);
  const deferred = useRef(null);

  useEffect(() => {
    if (standalone()) return undefined;
    let timer;
    const offer = (k) => {
      if (recentlyDismissed()) return;
      clearTimeout(timer);
      timer = setTimeout(() => { setKind(k); setVisible(true); }, 5000);
    };
    const onPrompt = (e) => { e.preventDefault(); deferred.current = e; offer("prompt"); };
    const onInstalled = () => { deferred.current = null; remember(); setVisible(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOS()) offer("ios");
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !kind) return null;
  const close = () => { remember(); setVisible(false); };
  const install = async () => {
    const ev = deferred.current;
    if (!ev) return close();
    ev.prompt();
    try { await ev.userChoice; } catch { /* ignore */ }
    deferred.current = null;
    close();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className="n1-no-print"
      style={{
        position: "fixed", zIndex: 90, left: "50%", bottom: 20,
        width: "min(440px, calc(100vw - 24px))", padding: 18, borderRadius: 22,
        background: `linear-gradient(160deg, ${C.surface}, ${C.surface2})`, color: C.ink,
        border: `1px solid ${C.line}`, boxShadow: "0 28px 60px -20px rgba(8,25,40,0.55)",
        animation: "n1-install-in .35s cubic-bezier(.2,.8,.2,1) both", transform: "translateX(-50%)",
      }}
    >
      <style>{"@keyframes n1-install-in{from{opacity:0;transform:translate(-50%,24px)}to{opacity:1;transform:translate(-50%,0)}}"}</style>
      <button type="button" onClick={close} aria-label="Close" className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full" style={{ color: C.muted }}>
        <X size={18} />
      </button>
      <div className="flex items-center gap-3.5 pr-6">
        <div className="shrink-0 rounded-2xl p-2.5" style={{ background: "#0a1f3d" }}><KashLogo size={30} onDark /></div>
        <div className="min-w-0">
          <h3 id="install-title" className="font-display font-bold text-base">Install KASH ERP</h3>
          {kind === "ios" ? (
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>
              Tap <Share size={14} className="inline -mt-0.5" /> <b>Share</b> in Safari, then <b>Add to Home Screen</b>.
            </p>
          ) : (
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>
              Open it like an app from your home screen or desktop, with a faster start and its own window.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2.5 mt-4">
        {kind === "ios" ? (
          <button type="button" onClick={close} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: C.blue }}>Got it</button>
        ) : (
          <>
            <button type="button" onClick={install} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: C.blue }}>
              <Download size={16} /> Install app
            </button>
            <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: C.surface2, color: C.ink2 }}>Not now</button>
          </>
        )}
      </div>
    </div>
  );
}
