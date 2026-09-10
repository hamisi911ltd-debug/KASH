/* Navigation model, shared by the sidebar, mobile nav and command palette. */
import {
  LayoutDashboard, LayoutGrid, Truck, UtensilsCrossed, BedDouble,
  Users, BarChart3, Wallet, Bell, Settings,
} from "lucide-react";

export const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, group: "main" },
  { key: "all", label: "All Services", icon: LayoutGrid, group: "main" },
  { key: "transport", label: "Transport", icon: Truck, group: "divisions" },
  { key: "food", label: "Food", icon: UtensilsCrossed, group: "divisions" },
  { key: "hospitality", label: "Hospitality", icon: BedDouble, group: "divisions" },
  { key: "expenses", label: "Expenses", icon: Wallet, group: "finance" },
  { key: "reports", label: "Reports", icon: BarChart3, group: "finance" },
  { key: "users", label: "Users & Roles", icon: Users, group: "admin" },
  { key: "updates", label: "Updates", icon: Bell, group: "admin" },
  { key: "settings", label: "Settings", icon: Settings, group: "admin" },
];

export const NAV_GROUPS = [
  { key: "main", label: "" },
  { key: "divisions", label: "Divisions" },
  { key: "finance", label: "Finance" },
  { key: "admin", label: "Administration" },
];
