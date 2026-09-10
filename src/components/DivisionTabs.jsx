/* The big horizontal service switcher shown under the top bar on every
   page. One tap from anywhere to Home / Transport / Food / Hospitality. */
import React from "react";
import { C } from "../lib/constants";
import { PRIMARY_TABS } from "./nav.js";
import { canOpenView } from "../lib/auth";

export default function DivisionTabs({ role, activeView, onNavigate }) {
  const tabs = PRIMARY_TABS.filter((t) => canOpenView(role, t.key));
  if (tabs.length <= 1) return null;

  return (
    <div
      className="flex gap-2 px-4 lg:px-8 py-3 overflow-x-auto n1-scroll border-b n1-no-print"
      style={{ background: C.surface, borderColor: C.line }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = activeView === t.key || (t.key === "overview" && activeView === "all");
        return (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shrink-0 transition-all active:scale-[0.97]"
            style={
              active
                ? { background: t.color, color: "#fff", boxShadow: C.shadowSm }
                : { background: C.surface2, color: C.ink2 }
            }
          >
            <Icon size={16} strokeWidth={2.4} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
