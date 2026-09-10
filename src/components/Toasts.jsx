/* Toast stack. Reads the queue straight from the store. */
import React from "react";
import { CheckCircle2, Info, AlertTriangle, X, Undo2 } from "lucide-react";
import { C } from "../lib/constants";
import { useStore } from "../lib/store.jsx";

const ICONS = { success: CheckCircle2, info: Info, error: AlertTriangle, warn: AlertTriangle };
const COLORS = { success: C.emerald, info: C.blue, error: C.coral, warn: C.amber };

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end" style={{ zIndex: 110 }}>
      {toasts.map((t) => {
        const Icon = ICONS[t.tone] || Info;
        return (
          <div
            key={t.id}
            className="n1-rise flex items-center gap-3 rounded-xl border px-4 py-3 sm:min-w-[280px] sm:max-w-md"
            style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowLg }}
          >
            <Icon size={18} style={{ color: COLORS[t.tone] || C.blue }} className="shrink-0" />
            <span className="text-sm font-medium flex-1" style={{ color: C.ink }}>{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismissToast(t.id); }}
                className="inline-flex items-center gap-1 text-xs font-bold shrink-0"
                style={{ color: C.blue }}
              >
                <Undo2 size={13} /> {t.action.label}
              </button>
            )}
            <button onClick={() => dismissToast(t.id)} className="shrink-0" style={{ color: C.faint }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
