/* A temporary picture pop-up shown when the ERP opens (once per visit).
   To take it down: delete this file and its two lines in src/main.jsx. */
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Spotlight() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("kash-spotlight")) return undefined; } catch { /* private mode: show anyway */ }
    const t = setTimeout(() => setOpen(true), 3300); // after the launch screen
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  function close() {
    try { sessionStorage.setItem("kash-spotlight", "1"); } catch { /* ignore */ }
    setOpen(false);
  }
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="Featured picture"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ position: "fixed", inset: 0, zIndex: 95, display: "grid", placeItems: "center", padding: 20, background: "rgba(4,12,26,0.72)", backdropFilter: "blur(4px)", animation: "kashSpotFade .3s ease both" }}
    >
      <style>{"@keyframes kashSpotFade{from{opacity:0}to{opacity:1}}@keyframes kashSpotPop{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div style={{ position: "relative", maxWidth: "min(420px, 92vw)", maxHeight: "92vh", borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9)", animation: "kashSpotPop .4s cubic-bezier(.2,.9,.3,1.1) both" }}>
        <button type="button" onClick={close} aria-label="Close" style={{ position: "absolute", top: 10, right: 10, width: 38, height: 38, borderRadius: "50%", border: 0, background: "rgba(0,0,0,0.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
          <X size={20} />
        </button>
        <img src="/spotlight.jpg" alt="Moana and Maui" width="452" height="678" style={{ display: "block", width: "100%", height: "auto", maxHeight: "92vh", objectFit: "contain" }} />
      </div>
    </div>
  );
}
