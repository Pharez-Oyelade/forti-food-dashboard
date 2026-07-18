import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const ROUTE_TITLES = {
  "/app/dashboard": "Dashboard",
  "/app/inventory": "Inventory",
  "/app/sales": "Sales Pipeline",
  "/app/mealmate": "My Meal Mate",
  "/app/social": "Social Media",
  "/app/gaps": "Business Gaps",
  "/app/admin/users": "User Management",
  "/app/bd": "BD Dashboard",
  "/app/bd/grants": "Grants",
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-bg-deepest relative overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          collapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <TopBar title={title} collapsed={collapsed} />
        <div className="flex-1 mt-16 p-6 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
