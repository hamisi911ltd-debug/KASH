/* ============================================================
   App shell + router + modal orchestration.
   ============================================================ */
import React, { useCallback, useMemo, useState } from "react";
import { useStore } from "./lib/store.jsx";
import { ActionsContext } from "./lib/actions.jsx";
import { canOpenView, capsForRole, viewsForRole, accountForRole } from "./lib/auth";
import { buildForms, QUICK_ACTION_KEYS } from "./lib/forms.js";
import { SINGULAR } from "./lib/store.jsx";
import { useHotkey } from "./lib/hooks.js";

import LoginView from "./views/LoginView.jsx";
import OverviewView from "./views/OverviewView.jsx";
import AllServicesView from "./views/AllServicesView.jsx";
import TransportView from "./views/TransportView.jsx";
import FoodView from "./views/FoodView.jsx";
import HospitalityView from "./views/HospitalityView.jsx";
import ExpensesView from "./views/ExpensesView.jsx";
import ReportsView from "./views/ReportsView.jsx";
import UsersView from "./views/UsersView.jsx";
import MessagesView from "./views/MessagesView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import PaymentsView from "./views/PaymentsView.jsx";

import { Sidebar, MobileDrawer, MobileBottomNav, Topbar } from "./components/Layout.jsx";
import { FormModal, ConfirmDialog, MpesaPrompt } from "./components/Modal.jsx";
import Toasts from "./components/Toasts.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import DivisionTabs from "./components/DivisionTabs.jsx";
import { C } from "./lib/constants";

const VIEWS = {
  overview: OverviewView,
  all: AllServicesView,
  transport: TransportView,
  food: FoodView,
  hospitality: HospitalityView,
  payments: PaymentsView,
  expenses: ExpensesView,
  reports: ReportsView,
  users: UsersView,
  updates: MessagesView,
  settings: SettingsView,
};

export default function App() {
  const store = useStore();
  const { data, session, setSession, prefs, setPrefs, addRecord, updateRecord, patchRecord, removeRecord, toast, notifyIfEnabled } = store;

  const [activeView, setActiveView] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modal, setModal] = useState(null); // { formKey, initial? }
  const [confirm, setConfirm] = useState(null); // { collection, id, label }
  const [mpesa, setMpesa] = useState(null); // pending M-Pesa payment record

  /* Deep-link: ?role=Accountant&view=reports opens straight into a role/view
     (handy for demos and screenshots). Runs once. */
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("role");
    if (!wanted) return;
    const acct = accountForRole(wanted);
    if (acct && acct.role !== session?.role) {
      setSession({ email: acct.email, name: acct.name, role: acct.role });
    }
    const v = q.get("view");
    if (v) setActiveView(v);
    // strip the params so a later refresh keeps the real session
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = session?.role || "Staff";
  const caps = useMemo(() => capsForRole(role), [role]);
  const forms = useMemo(() => buildForms(data), [data]);
  const quickActions = useMemo(
    () =>
      QUICK_ACTION_KEYS.map((k) => forms[k])
        .filter(Boolean)
        .filter((f) => (f.key === "payment" ? caps.payments : caps.write)),
    [forms, caps.write, caps.payments]
  );

  /* --- navigation guard: bounce to a permitted view if the role loses access --- */
  const navigate = useCallback(
    (key) => {
      if (!canOpenView(role, key)) {
        toast("You don't have access to that section", { tone: "warn" });
        return;
      }
      setActiveView(key);
      setDrawerOpen(false);
    },
    [role, toast]
  );

  const ensureAllowed = useCallback(() => {
    if (session && !canOpenView(role, activeView)) {
      const allowed = viewsForRole(role);
      setActiveView(allowed === "*" ? "overview" : allowed[0] || "settings");
    }
  }, [session, role, activeView]);
  React.useEffect(ensureAllowed, [ensureAllowed]);

  /* --- CRUD wired to forms --- */
  const openForm = useCallback((formKey, initial = null) => {
    const allowed = formKey === "payment" ? caps.payments : caps.write;
    if (!allowed) {
      toast("You can't do that with your role", { tone: "warn" });
      return;
    }
    setModal({ formKey, initial });
  }, [caps.write, caps.payments, toast]);

  const editRecord = useCallback(
    (collection, id) => {
      const formKey = Object.keys(forms).find((k) => forms[k].collection === collection);
      const record = data[collection]?.find((r) => r.id === id);
      if (!formKey || !record) return;
      setModal({ formKey, initial: record });
    },
    [forms, data]
  );

  const deleteRecord = useCallback(
    (collection, id) => {
      const label = SINGULAR[collection] || "Record";
      setConfirm({ collection, id, label });
    },
    []
  );

  const patchRoom = useCallback((id, status) => patchRecord("rooms", id, { status }), [patchRecord]);

  const handleFormSubmit = useCallback(
    (values) => {
      const form = forms[modal.formKey];
      if (!form) return;

      if (modal.initial) {
        updateRecord(form.collection, modal.initial.id, values);
        toast(`${SINGULAR[form.collection] || "Record"} updated`);
        return;
      }

      if (form.collection === "messages") {
        addRecord("messages", { ...values, from: session?.name || "", ts: new Date().toISOString(), read: false });
        toast(`Message sent to ${values.to}`);
        notifyIfEnabled("alerts", `New message from ${session?.name}`, { type: "message", division: "General" });
        return;
      }

      // New payment: M-Pesa fires an approval prompt; everything else records now.
      if (form.collection === "payments") {
        const reference = values.reference || `MP${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
        const isMpesa = values.method === "M-Pesa";
        const rec = addRecord("payments", {
          ...values,
          reference,
          createdBy: session?.name || "",
          status: isMpesa ? "Pending" : "Recorded",
        });
        if (isMpesa) {
          setMpesa(rec);
        } else {
          toast("Payment recorded");
          notifyIfEnabled(form.notify.channel, form.notify.message(values), {
            type: form.notify.type,
            division: values.division || form.notify.division,
          });
        }
        return;
      }

      addRecord(form.collection, values);
      toast(form.successToast || `${SINGULAR[form.collection] || "Record"} added`);
      if (form.notify) {
        notifyIfEnabled(form.notify.channel, form.notify.message(values), {
          type: form.notify.type,
          division: form.notify.division,
        });
      }
    },
    [forms, modal, addRecord, updateRecord, toast, notifyIfEnabled, session]
  );

  const confirmMpesa = useCallback(() => {
    if (!mpesa) return;
    patchRecord("payments", mpesa.id, { status: "Recorded" });
    toast("Payment confirmed & recorded");
    notifyIfEnabled(
      "expenses",
      mpesa.direction === "in"
        ? `Payment received from ${mpesa.party} - KSh ${Number(mpesa.amount).toLocaleString()}`
        : `Payment sent to ${mpesa.party} - KSh ${Number(mpesa.amount).toLocaleString()}`,
      { type: "payment", division: mpesa.division }
    );
    setMpesa(null);
  }, [mpesa, patchRecord, toast, notifyIfEnabled]);

  const cancelMpesa = useCallback(() => {
    if (!mpesa) return;
    patchRecord("payments", mpesa.id, { status: "Failed" });
    toast("Payment cancelled", { tone: "warn" });
    setMpesa(null);
  }, [mpesa, patchRecord, toast]);

  const confirmDelete = useCallback(() => {
    const restore = removeRecord(confirm.collection, confirm.id);
    toast(`${confirm.label} deleted`, {
      tone: "info",
      action: { label: "Undo", onClick: restore },
    });
  }, [confirm, removeRecord, toast]);

  /* --- shortcuts --- */
  useHotkey("mod+k", () => setPaletteOpen((o) => !o), []);
  useHotkey("mod+b", () => setDrawerOpen((o) => !o), []);

  if (!session) {
    return <LoginView onSignIn={(s) => { setSession(s); setActiveView("overview"); }} />;
  }

  const ActiveView = VIEWS[canOpenView(role, activeView) ? activeView : "overview"] || OverviewView;

  const actionsValue = {
    navigate,
    openForm,
    editRecord,
    deleteRecord,
    patchRoom,
    caps,
    role,
  };

  return (
    <ActionsContext.Provider value={actionsValue}>
      <div className="h-screen w-full flex overflow-hidden n1-theme-anim" style={{ background: C.bg, color: C.ink }}>
        <Sidebar
          role={role}
          activeView={activeView}
          onNavigate={navigate}
          onSignOut={() => setSession(null)}
          onSwitchRole={(r) => setSession((s) => ({ ...s, role: r }))}
          session={session}
        />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          role={role}
          activeView={activeView}
          onNavigate={navigate}
          onSignOut={() => setSession(null)}
          onSwitchRole={(r) => setSession((s) => ({ ...s, role: r }))}
          session={session}
        />

        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <Topbar
            role={role}
            session={session}
            onMenu={() => setDrawerOpen(true)}
            onNavigate={navigate}
            onOpenPalette={() => setPaletteOpen(true)}
            onQuickAction={(k) => openForm(k)}
            quickActions={quickActions}
          />
          <DivisionTabs role={role} activeView={activeView} onNavigate={navigate} />
          <main className="flex-1 min-h-0 overflow-y-auto n1-scroll p-4 md:p-8 pb-24 lg:pb-8 n1-print-full">
            <div className="max-w-[1400px] mx-auto">
              <ActiveView />
            </div>
          </main>
          <MobileBottomNav role={role} activeView={activeView} onNavigate={navigate} onMore={() => setDrawerOpen(true)} />
        </div>

        <Toasts />

        {modal && forms[modal.formKey] && (
          <FormModal
            config={forms[modal.formKey]}
            initial={modal.initial}
            onClose={() => setModal(null)}
            onSubmit={handleFormSubmit}
          />
        )}

        {confirm && (
          <ConfirmDialog
            title={`Delete this ${confirm.label.toLowerCase()}?`}
            message="This removes it from every view and report. You can undo straight after."
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onClose={() => setConfirm(null)}
          />
        )}

        {mpesa && <MpesaPrompt payment={mpesa} onConfirm={confirmMpesa} onCancel={cancelMpesa} />}

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          role={role}
          onNavigate={navigate}
          onQuickAction={(k) => openForm(k)}
          quickActions={quickActions}
        />
      </div>
    </ActionsContext.Provider>
  );
}
