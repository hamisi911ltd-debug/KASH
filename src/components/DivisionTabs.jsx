/* The big horizontal service switcher shown under the top bar on every
   page. One tap from anywhere to Home / Transport / Food / Hospitality. */
import React from "react";
import { C } from "../lib/constants";
import { PRIMARY_TABS, NAV, SIDEBAR_KEYS } from "./nav.js";
import { canOpenView } from "../lib/auth";

export default function DivisionTabs({ role, activeView, onNavigate }) {
  let tabs = PRIMARY_TABS.filter((t) => canOpenView(role, t.key));
  /* A role with just one permitted tab (a Driver only has "Transport",
     say) still needs it shown - it's their only way back to their own
     division page once they've navigated to Payments/Settings, since
     division pages are deliberately left out of the sidebar. */
  /* A role with none of the four main spaces (the IT Officer, say, who
     only has Website/Messages) would otherwise see a blank bar here -
     fall back to whatever that role does have, so it's never empty. */
  if (tabs.length === 0) {
    tabs = NAV
      .filter((n) => canOpenView(role, n.key) && SIDEBAR_KEYS.includes(n.key))
      .map((n) => ({ key: n.key, label: n.label, icon: n.icon, color: C.blue }));
  }
  if (tabs.length === 0) return null;

  return (
    <div
      className="shrink-0 flex gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-8 py-2 overflow-x-auto n1-scroll border-b n1-no-print"
      style={{ background: C.surface, borderColor: C.line }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = activeView === t.key || (t.key === "overview" && activeView === "all");
        return (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shrink-0 transition-all active:scale-[0.97]"
            style={
              active
                ? { background: t.color, color: "#fff", boxShadow: C.shadowSm }
                : { background: C.surface2, color: C.ink2 }
            }
          >
            <Icon size={15} strokeWidth={2.4} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
