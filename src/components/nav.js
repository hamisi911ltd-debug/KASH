/* Navigation model, shared by the sidebar, top tabs, mobile nav and command palette. */
import {
  LayoutDashboard, LayoutGrid, Truck, Beef, BedDouble, Wrench,
  Users, BarChart3, Wallet, Bell, Settings, ArrowLeftRight, MessagesSquare,
} from "lucide-react";
import { C } from "../lib/constants";

export const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, group: "main" },
  { key: "all", label: "All Services", icon: LayoutGrid, group: "main" },
  { key: "transport", label: "Transport", icon: Truck, group: "divisions" },
  { key: "food", label: "Butchery", icon: Beef, group: "divisions" },
  { key: "hospitality", label: "Hospitality", icon: BedDouble, group: "divisions" },
  { key: "maintenance", label: "Maintenance", icon: Wrench, group: "operations" },
  { key: "payments", label: "Payments", icon: ArrowLeftRight, group: "finance" },
  { key: "expenses", label: "Expenses", icon: Wallet, group: "finance" },
  { key: "reports", label: "Reports", icon: BarChart3, group: "finance" },
  { key: "users", label: "Users & Roles", icon: Users, group: "admin" },
  { key: "updates", label: "Messages", icon: MessagesSquare, group: "admin" },
  { key: "settings", label: "Settings", icon: Settings, group: "admin" },
];

export const NAV_GROUPS = [
  { key: "main", label: "" },
  { key: "operations", label: "" },
  { key: "finance", label: "Finance" },
  { key: "admin", label: "Administration" },
];

/* The primary spaces - shown as big horizontal tabs on every page and in the
   mobile bottom bar. Kept out of the sidebar so it stays short. */
export const PRIMARY_TABS = [
  { key: "overview", label: "Home", icon: LayoutDashboard, color: C.blue },
  { key: "transport", label: "Transport", icon: Truck, color: C.emerald },
  { key: "food", label: "Butchery", icon: Beef, color: C.amber },
  { key: "hospitality", label: "Hospitality", icon: BedDouble, color: C.coral },
];

export const PRIMARY_KEYS = PRIMARY_TABS.map((t) => t.key);

/* Sidebar hides the division pages (they live in the top tabs instead). */
export const SIDEBAR_KEYS = NAV.map((n) => n.key).filter((k) => !["transport", "food", "hospitality", "settings"].includes(k));
