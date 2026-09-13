/* ============================================================
   App shell + router + modal orchestration.
   ============================================================ */
import React, { useCallback, useMemo, useState } from "react";
import { useStore } from "./lib/store.jsx";
import { ActionsContext } from "./lib/actions.jsx";
import { canOpenView, capsForRole, viewsForRole, login, demoAccountForRole, DEMO_PASSWORD } from "./lib/auth";
import { buildForms, QUICK_ACTION_KEYS } from "./lib/forms.js";
import { SINGULAR } from "./lib/schema.js";
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
import { KashLogo } from "./components/Logo.jsx";
import { Spinner } from "./components/ui.jsx";
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
  const {
    data, dataLoading, dataError, session, setSession, prefs, setPrefs,
    addRecord, updateRecord, patchRecord, removeRecord, patchRoom, toast, notifyIfEnabled,
  } = store;

  const [activeView, setActiveView] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modal, setModal] = useState(null); // { formKey, initial? }
  const [confirm, setConfirm] = useState(null); // { collection, id, label }
  const [mpesa, setMpesa] = useState(null); // pending M-Pesa payment record

  /* Deep-link: ?role=Accountant&view=reports signs straight into a demo
     role/view (handy for demos and screenshots). Runs once. */
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("role");
    const v = q.get("view");
    window.history.replaceState(null, "", window.location.pathname);
    if (!wanted) return;
    const acct = demoAccountForRole(wanted);
    if (!acct) return;
    (async () => {
      try {
        const res = await login(acct.email, DEMO_PASSWORD);
        setSession({ token: res.token, ...res.user });
        if (v) setActiveView(v);
      } catch {
        /* deep-link demo account unavailable - ignore, land on sign-in */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = session?.role || "Staff";
  const caps = useMemo(() => capsForRole(role), [role]);
  const forms = useMemo(() => buildForms(data, session), [data, session]);
  const canUseForm = useCallback(
    (form) => {
      // A form tied to one division (trip/vehicle -> transport, order -> food,
      // booking -> hospitality, ...) only ever shows up for a role that can
      // actually open that division's page - so a Driver's quick-create menu
      // never offers "New order", and a Transport Manager's never offers
      // "New booking". Quick actions mirror the navigation, not a superset.
      if (form.view && !canOpenView(role, form.view)) return false;
      if (form.key === "payment") return caps.payments;
      return caps.write || (form.ownAllowed && caps.writeOwn);
    },
    [role, caps.write, caps.writeOwn, caps.payments]
  );
  const quickActions = useMemo(
    () => QUICK_ACTION_KEYS.map((k) => forms[k]).filter(Boolean).filter(canUseForm),
    [forms, canUseForm]
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
    const form = forms[formKey];
    if (!form || !canUseForm(form)) {
      toast("You can't do that with your role", { tone: "warn" });
      return;
    }
    setModal({ formKey, initial });
  }, [forms, canUseForm, toast]);

  const editRecord = useCallback(
    (collection, id) => {
      const formKey = Object.keys(forms).find((k) => forms[k].collection === collection);
      const record = data[collection]?.find((r) => r.id === id);
      if (!formKey || !record) return;
      setModal({ formKey, initial: record });
    },
    [forms, data]
  );

  const deleteRecord = useCallback((collection, id) => {
    const label = SINGULAR[collection] || "Record";
    setConfirm({ collection, id, label });
  }, []);

  const handleFormSubmit = useCallback(
    async (values) => {
      const form = forms[modal.formKey];
      if (!form) return;

      try {
        if (modal.initial && modal.initial.id) {
          const autofill = form.autofillFor ? form.autofillFor(session, data) : {};
          await updateRecord(form.collection, modal.initial.id, { ...autofill, ...values });
          toast(`${SINGULAR[form.collection] || "Record"} updated`);
          // Uber-style flow: ending a trip rolls straight into collecting the fare.
          if (form.key === "endTrip") {
            const party = modal.initial.client || "Passenger";
            const amount = values.amount;
            setTimeout(() => {
              openForm("payment", { direction: "in", division: "Transport", party, amount, method: "M-Pesa" });
            }, 0);
          }
          return;
        }

        if (form.collection === "messages") {
          await addRecord("messages", { ...values, from: session?.name || "", ts: new Date().toISOString(), read: false });
          toast(`Message sent to ${values.to}`);
          notifyIfEnabled("alerts", `New message from ${session?.name}`, { type: "message", division: "General" });
          return;
        }

        // New payment: M-Pesa fires an approval prompt; everything else records now.
        if (form.collection === "payments") {
          const isMpesa = values.method === "M-Pesa";
          const rec = await addRecord("payments", values);
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

        const autofill = form.autofillFor ? form.autofillFor(session, data) : {};
        await addRecord(form.collection, { ...autofill, ...values });
        toast(form.successToast || `${SINGULAR[form.collection] || "Record"} added`);
        if (form.notify) {
          notifyIfEnabled(form.notify.channel, form.notify.message(values), {
            type: form.notify.type,
            division: form.notify.division,
          });
        }
      } catch (e) {
        toast(e.message || "Something went wrong saving that.", { tone: "error" });
      }
    },
    [forms, modal, addRecord, updateRecord, toast, notifyIfEnabled, session, data, openForm]
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

  const confirmDelete = useCallback(async () => {
    const { collection, id, label } = confirm;
    try {
      const restore = await removeRecord(collection, id);
      toast(`${label} deleted`, { tone: "info", action: { label: "Undo", onClick: restore } });
    } catch (e) {
      toast(e.message || "Could not delete that.", { tone: "error" });
    }
  }, [confirm, removeRecord, toast]);

  /* Admin "preview as role" dropdown: a real re-login as that role's demo
     account (server-enforced scoping means there's no faking this client-side). */
  const switchRole = useCallback(
    async (r) => {
      const acct = demoAccountForRole(r);
      if (!acct) return;
      try {
        const res = await login(acct.email, DEMO_PASSWORD);
        setSession({ token: res.token, ...res.user });
        toast(`Now viewing as ${r}`);
      } catch {
        toast("No demo account for that role.", { tone: "warn" });
      }
    },
    [setSession, toast]
  );

  /* --- shortcuts --- */
  useHotkey("mod+k", () => setPaletteOpen((o) => !o), []);
  useHotkey("mod+b", () => setDrawerOpen((o) => !o), []);

  if (!session) {
    return (
      <LoginView
        onSignIn={(s, startView) => {
          setSession(s);
          setActiveView(startView && canOpenView(s.role, startView) ? startView : "overview");
        }}
      />
    );
  }

  if (dataLoading) {
    return (
      <div className="h-[100svh] w-full flex flex-col items-center justify-center gap-4" style={{ background: C.bg }}>
        <KashLogo size={28} />
        <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
          <Spinner size={15} color={C.blue} /> Loading your workspace...
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="h-[100svh] w-full flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: C.bg }}>
        <KashLogo size={28} />
        <p className="text-sm font-semibold" style={{ color: C.coral }}>Couldn't reach the server</p>
        <p className="text-xs max-w-sm" style={{ color: C.muted }}>{dataError}</p>
        <button onClick={() => store.resync()} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: C.blue, color: "#fff" }}>
          Try again
        </button>
        <button onClick={() => setSession(null)} className="text-xs font-semibold" style={{ color: C.muted }}>Sign out</button>
      </div>
    );
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
      <div className="h-[100svh] w-full flex overflow-hidden n1-theme-anim" style={{ background: C.bg, color: C.ink }}>
        <Sidebar
          role={role}
          activeView={activeView}
          onNavigate={navigate}
          onSignOut={() => setSession(null)}
          onSwitchRole={switchRole}
          session={session}
        />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          role={role}
          activeView={activeView}
          onNavigate={navigate}
          onSignOut={() => setSession(null)}
          onSwitchRole={switchRole}
          session={session}
        />

        <div className="flex-1 flex flex-col min-w-0 h-[100svh]">
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
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain n1-scroll p-3 sm:p-4 md:p-8 pb-24 lg:pb-8 n1-print-full">
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
