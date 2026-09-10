/* ============================================================
   The app shell: fixed sidebar (desktop), slide-over drawer and
   bottom bar (mobile), and the top bar with search, notifications,
   quick-create and the profile menu.
   ============================================================ */
import React, { useMemo, useRef, useState } from "react";
import {
  LogOut, Menu, X, Search, Plus, ChevronDown, ChevronUp, Sun, Moon,
  Command, Calendar, Settings as SettingsIcon,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatDateLong } from "../lib/format";
import { useStore } from "../lib/store.jsx";
import { NAV, NAV_GROUPS, SIDEBAR_KEYS, PRIMARY_TABS } from "./nav.js";
import { KashLogo } from "./Logo.jsx";
import { canOpenView, capsForRole } from "../lib/auth";
import { ROLES } from "../lib/constants";
import { Avatar } from "./ui.jsx";
import { useOnDismiss, useMediaQuery } from "../lib/hooks.js";

/* ---------------------------------------------------------- nav list */

function NavLinks({ role, activeView, onNavigate }) {
  const items = NAV.filter((n) => canOpenView(role, n.key) && SIDEBAR_KEYS.includes(n.key));
  return (
    <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto n1-scroll">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group.key);
        if (!groupItems.length) return null;
        return (
          <div key={group.key} className="mb-2">
            {group.label && (
              <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.faint }}>
                {group.label}
              </p>
            )}
            {groupItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    background: active ? C.blue : "transparent",
                    color: active ? "#fff" : C.ink2,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surface2; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ compact }) {
  return <KashLogo size={compact ? 24 : 26} tagline={!compact} />;
}

/* Account block at the foot of the sidebar - click to reveal Settings / role / Sign out. */
function AccountMenu({ session, role, onNavigate, onSignOut, onSwitchRole }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useStore();
  const ref = useRef(null);
  useOnDismiss(ref, () => setOpen(false), open);
  return (
    <div className="relative px-3 py-3 border-t" style={{ borderColor: C.line }} ref={ref}>
      {open && (
        <div
          className="n1-pop absolute left-3 right-3 bottom-full mb-2 rounded-xl border py-1.5"
          style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowLg, zIndex: 80 }}
        >
          <div className="px-3.5 py-2 border-b" style={{ borderColor: C.line }}>
            <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{session?.name}</p>
            <p className="text-xs truncate" style={{ color: C.muted }}>{session?.email}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:opacity-70"
            style={{ color: C.ink }}
          >
            {theme === "dark" ? <Sun size={14} style={{ color: C.muted }} /> : <Moon size={14} style={{ color: C.muted }} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={() => { onNavigate("settings"); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:opacity-70"
            style={{ color: C.ink }}
          >
            <SettingsIcon size={14} style={{ color: C.muted }} /> Settings
          </button>
          {onSwitchRole && (
            <div className="px-3.5 py-2 border-t" style={{ borderColor: C.line }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Preview as role</p>
              <select
                value={role}
                onChange={(e) => onSwitchRole(e.target.value)}
                className="w-full rounded-lg border px-2 py-1.5 text-xs"
                style={{ borderColor: C.line }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={() => { onSignOut(); setOpen(false); }}
            className="w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 border-t hover:opacity-70"
            style={{ color: C.coral, borderColor: C.line }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors"
        style={{ background: open ? C.surface2 : "transparent" }}
      >
        <Avatar name={session?.name} size={34} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-bold truncate" style={{ color: C.ink }}>{session?.name}</p>
          <p className="text-[11px] truncate" style={{ color: C.muted }}>{role}</p>
        </div>
        {open ? <ChevronDown size={14} style={{ color: C.faint }} /> : <ChevronUp size={14} style={{ color: C.faint }} />}
      </button>
    </div>
  );
}


/* ---------------------------------------------------------- sidebar / drawer */

export function Sidebar({ role, activeView, onNavigate, onSignOut, onSwitchRole, session }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen border-r" style={{ background: C.surface, borderColor: C.line }}>
      <div className="px-5 py-6">
        <Brand />
      </div>
      <NavLinks role={role} activeView={activeView} onNavigate={onNavigate} />
      <AccountMenu session={session} role={role} onNavigate={onNavigate} onSignOut={onSignOut} onSwitchRole={onSwitchRole} />
    </aside>
  );
}

export function MobileDrawer({ open, onClose, role, activeView, onNavigate, onSignOut, onSwitchRole, session }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: 95 }}>
      <div className="absolute inset-0 n1-fade" style={{ background: "rgba(6,10,20,0.6)" }} onClick={onClose} />
      <div className="n1-pop absolute left-0 top-0 bottom-0 w-72 flex flex-col" style={{ background: C.surface }}>
        <div className="px-5 py-6 flex items-center justify-between">
          <Brand />
          <button onClick={onClose} style={{ color: C.muted }}><X size={18} /></button>
        </div>
        <NavLinks role={role} activeView={activeView} onNavigate={(k) => { onNavigate(k); onClose(); }} />
        <AccountMenu session={session} role={role} onNavigate={(k) => { onNavigate(k); onClose(); }} onSignOut={onSignOut} onSwitchRole={onSwitchRole} />
      </div>
    </div>
  );
}

export function MobileBottomNav({ role, activeView, onNavigate, onMore }) {
  const items = PRIMARY_TABS.filter((t) => canOpenView(role, t.key));
  return (
    <div
      className="lg:hidden n1-bottomnav flex items-stretch border-t"
      style={{ zIndex: 60, background: C.surface, borderColor: C.line }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.key;
        return (
          <button key={item.key} onClick={() => onNavigate(item.key)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
            <Icon size={19} style={{ color: active ? item.color : C.muted }} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-semibold" style={{ color: active ? item.color : C.muted }}>{item.label}</span>
          </button>
        );
      })}
      <button onClick={onMore} className="flex-1 flex flex-col items-center gap-1 py-2.5">
        <Menu size={19} style={{ color: C.muted }} />
        <span className="text-[10px] font-semibold" style={{ color: C.muted }}>More</span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- top bar */

function QuickCreateMenu({ actions, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnDismiss(ref, () => setOpen(false), open);
  if (!actions.length) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-transform active:scale-95"
        style={{ background: C.blue }}
      >
        <Plus size={16} /> <span className="hidden sm:inline">New</span> <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="n1-pop absolute right-0 mt-2 w-52 rounded-2xl border py-1.5"
          style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowLg, zIndex: 70 }}
        >
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => { onPick(a.key); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors hover:opacity-70"
              style={{ color: C.ink }}
            >
              {a.icon && <a.icon size={14} style={{ color: C.muted }} />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar({
  session, onMenu, onNavigate,
  onOpenPalette, onQuickAction, quickActions,
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <header
      className="shrink-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 border-b n1-no-print"
      style={{ zIndex: 50, background: C.surface, borderColor: C.line }}
    >
      {/* mobile: brand mark in the top-left; tap to open the menu */}
      <button
        onClick={onMenu}
        className="lg:hidden shrink-0 -my-1 py-1 pr-1"
        aria-label="Open menu"
      >
        <KashLogo size={20} />
      </button>

      <button
        onClick={onOpenPalette}
        className="flex-1 min-w-0 flex items-center gap-2 max-w-md rounded-lg px-3 py-2 text-left transition-colors"
        style={{ background: C.surface2 }}
      >
        <Search size={16} style={{ color: C.muted }} />
        <span className="text-sm flex-1 truncate" style={{ color: C.faint }}>Search or jump to...</span>
        {isDesktop && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: C.surface, color: C.faint }}>
            <Command size={10} /> K
          </span>
        )}
      </button>

      <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: C.surface2, color: C.muted }}>
        <Calendar size={14} /> {formatDateLong(new Date())}
      </div>

      <div className="ml-auto shrink-0">
        <QuickCreateMenu actions={quickActions} onPick={onQuickAction} />
      </div>
    </header>
  );
}
