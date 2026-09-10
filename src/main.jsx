import React from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./lib/store.jsx";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "Inter, sans-serif", maxWidth: 560, margin: "10vh auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => { localStorage.clear(); location.reload(); }}
            style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8, background: "#2f6fed", color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }}
          >
            Reset workspace &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

/* Dismiss the launch splash once the app has painted (with a short
   minimum so the logo animation always gets to play). */
(() => {
  const START = performance.now();
  const MIN_MS = 900;
  const dismiss = () => {
    const el = document.getElementById("kash-splash");
    if (!el || el.classList.contains("hide")) return;
    el.classList.add("hide");
    setTimeout(() => el.remove(), 500);
  };
  requestAnimationFrame(() => {
    const wait = Math.max(0, MIN_MS - (performance.now() - START));
    setTimeout(dismiss, wait);
  });
})();
