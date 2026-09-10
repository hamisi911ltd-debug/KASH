/* ============================================================
   Modal system: a generic data-driven form modal, a confirm dialog,
   and a side drawer for record detail. All three share one overlay
   treatment so the app feels like a single coherent product.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { C } from "../lib/constants";
import { Button } from "./ui.jsx";

function Overlay({ onClose, children, align = "center" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 flex px-4 n1-fade ${align === "center" ? "items-center justify-center" : "items-stretch justify-end"}`}
      style={{ zIndex: 90, background: "rgba(6,10,20,0.6)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- field renderer */

function Field({ field, value, onChange, error }) {
  const base = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-transparent";
  const style = { borderColor: error ? C.coral : C.line, background: C.surface };

  if (field.type === "select") {
    const opts = typeof field.options === "function" ? field.options() : field.options;
    return (
      <select value={value ?? ""} onChange={(e) => onChange(field.key, e.target.value)} className={base} style={style}>
        {field.placeholder && <option value="" disabled>{field.placeholder}</option>}
        {opts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={field.rows || 3}
        className={base}
        style={style}
        placeholder={field.placeholder || ""}
      />
    );
  }
  if (field.type === "toggle") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!!value}
        onClick={() => onChange(field.key, !value)}
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: value ? C.blue : C.surface3 }}
      >
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: value ? 22 : 2 }} />
      </button>
    );
  }
  return (
    <input
      type={field.type || "text"}
      value={value ?? ""}
      min={field.min}
      step={field.step}
      onChange={(e) => onChange(field.key, e.target.value)}
      className={base}
      style={style}
      placeholder={field.placeholder || ""}
      autoComplete="off"
    />
  );
}

/* ---------------------------------------------------------- FormModal */

/**
 * Data-driven create/edit modal.
 * `config.fields` supports: text, number, date, email, tel, select, textarea, toggle.
 * A field may set `computed(values)` to derive a live read-only preview line,
 * and `visibleIf(values)` to conditionally show/hide itself.
 */
export function FormModal({ config, initial, onClose, onSubmit }) {
  const isEdit = !!initial;
  const [values, setValues] = useState(() => {
    const base = {};
    config.fields.forEach((f) => {
      const opts = typeof f.options === "function" ? f.options() : f.options;
      base[f.key] = initial?.[f.key] ?? f.default ?? (f.type === "select" ? (opts?.[0]?.value ?? "") : f.type === "toggle" ? false : "");
    });
    return base;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus?.();
  }, []);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));
  };

  const validate = () => {
    const errs = {};
    config.fields.forEach((f) => {
      if (f.visibleIf && !f.visibleIf(values)) return;
      const v = values[f.key];
      if (f.required && (v === "" || v == null)) errs[f.key] = "Required";
      if (f.type === "number" && v !== "" && Number.isNaN(Number(v))) errs[f.key] = "Must be a number";
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errs[f.key] = "Invalid email";
      if (f.validate) {
        const msg = f.validate(v, values);
        if (msg) errs[f.key] = msg;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div
        className="n1-pop w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: C.surface, maxHeight: "88vh", boxShadow: C.shadowLg }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: C.line }}>
          <div>
            <h3 className="text-base font-bold font-display" style={{ color: C.ink }}>
              {isEdit ? config.editTitle || `Edit ${config.title}` : config.title}
            </h3>
            {config.subtitle && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{config.subtitle}</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center transition-colors" style={{ color: C.muted }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto n1-scroll px-6 py-5 space-y-4">
          {config.fields.map((f, i) => {
            if (f.visibleIf && !f.visibleIf(values)) return null;
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold" style={{ color: C.muted }}>{f.label}</label>
                  {f.computed && (
                    <span className="text-xs font-semibold" style={{ color: C.blue }}>{f.computed(values)}</span>
                  )}
                </div>
                <div ref={i === 0 ? firstRef : undefined} tabIndex={i === 0 ? -1 : undefined}>
                  <Field field={f} value={values[f.key]} onChange={handleChange} error={errors[f.key]} />
                </div>
                {errors[f.key] && <p className="text-xs mt-1 font-medium" style={{ color: C.coral }}>{errors[f.key]}</p>}
                {f.hint && !errors[f.key] && <p className="text-xs mt-1" style={{ color: C.faint }}>{f.hint}</p>}
              </div>
            );
          })}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: C.line }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? config.editSubmitLabel || "Save changes" : config.submitLabel || "Save"}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------------------------------------------------- ConfirmDialog */

export function ConfirmDialog({ title, message, confirmLabel = "Delete", tone = "danger", onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div
        className="n1-pop w-full max-w-sm rounded-2xl p-6"
        style={{ background: C.surface, boxShadow: C.shadowLg }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.coralSoft }}>
            <AlertTriangle size={18} style={{ color: C.coral }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-display" style={{ color: C.ink }}>{title}</h3>
            <p className="text-sm mt-1.5" style={{ color: C.muted }}>{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------------------------------------------------- Drawer (side panel) */

export function Drawer({ title, subtitle, onClose, children, footer, width = 420 }) {
  return (
    <Overlay onClose={onClose} align="end">
      <div
        className="n1-pop h-full overflow-y-auto n1-scroll flex flex-col"
        style={{ width: "100%", maxWidth: width, background: C.surface, boxShadow: C.shadowLg }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 shrink-0" style={{ borderColor: C.line, background: C.surface, zIndex: 1 }}>
          <div className="min-w-0">
            <h3 className="text-base font-bold font-display truncate" style={{ color: C.ink }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ color: C.muted }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t sticky bottom-0" style={{ borderColor: C.line, background: C.surface }}>
            {footer}
          </div>
        )}
      </div>
    </Overlay>
  );
}
