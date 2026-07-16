import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  UtensilsCrossed,
  Instagram,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SECTIONS } from "../../../../shared/constants.js";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      {
        to: "/app/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        section: null,
      },
      {
        to: "/app/reports/weekly",
        icon: FileText,
        label: "Weekly Report",
        section: null, // Accessible by all authenticated users
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        to: "/app/inventory",
        icon: Package,
        label: "Inventory",
        section: SECTIONS.INVENTORY,
      },
      {
        to: "/app/sales",
        icon: TrendingUp,
        label: "Sales Pipeline",
        section: SECTIONS.PIPELINE,
      },
    ],
  },
  {
    label: "PROGRAMS",
    items: [
      {
        to: "/app/mealmate",
        icon: UtensilsCrossed,
        label: "My Meal Mate",
        section: SECTIONS.MEALMATE,
      },
      {
        to: "/app/social",
        icon: Instagram,
        label: "Social Media",
        section: SECTIONS.SOCIAL,
      },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        to: "/app/gaps",
        icon: AlertTriangle,
        label: "Business Gaps",
        section: SECTIONS.BUSINESS_GAPS,
      },
    ],
  },
  {
    label: "ADMIN",
    items: [
      {
        to: "/app/admin/users",
        icon: Users,
        label: "User Management",
        section: SECTIONS.USER_MGMT,
      },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { canRead } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-[#0e2a2c]/80 backdrop-blur-xl border-r border-brand-lime/10 flex flex-col z-40 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
      id="sidebar-nav"
    >
      <div
        className={`flex items-center h-16 border-b border-brand-lime/10 flex-shrink-0 ${collapsed ? "px-0 justify-center" : "px-5"}`}
      >
        <div
          className={`flex items-center justify-center rounded-xl bg-brand-lime text-brand-dark font-bold text-xl flex-shrink-0 ${collapsed ? "w-10 h-10" : "w-10 h-10 mr-3"}`}
        >
          F
        </div>
        {!collapsed && (
          <div className="flex flex-col whitespace-nowrap overflow-hidden">
            <span className="text-gray-100 font-bold text-base tracking-wide leading-tight">
              Forti Foods
            </span>
            <span className="text-brand-lime/70 text-xs font-medium uppercase tracking-wider">
              Dashboard
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 custom-scrollbar px-3 flex flex-col gap-6">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.section || canRead(item.section),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="flex flex-col gap-2">
              {!collapsed && (
                <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest px-2 mb-1">
                  {group.label}
                </span>
              )}
              <ul className="flex flex-col gap-1">
                {visibleItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      id={`nav-${item.to.replace(/\//g, "-").slice(1)}`}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg h-10 transition-all ${
                          collapsed
                            ? "justify-center w-10 mx-auto px-0"
                            : "px-3 gap-3"
                        } ${
                          isActive
                            ? "bg-brand-lime/10 text-brand-lime"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="shrink-0" size={20} />
                      {!collapsed && (
                        <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        className="h-14 border-t border-brand-lime/10 flex items-center justify-center text-gray-500 hover:text-brand-lime hover:bg-gray-800/30 transition-colors"
        onClick={onToggle}
        id="sidebar-toggle"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${!collapsed ? "bg-gray-800/50 mr-2" : ""}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </div>
        {!collapsed && <span className="text-sm font-medium">Collapse</span>}
      </button>
    </aside>
  );
}
