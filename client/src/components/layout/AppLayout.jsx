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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-bg-deepest relative overflow-hidden">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed((c) => !c)} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] max-md:ml-0 ${
          collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <TopBar 
          title={title} 
          collapsed={collapsed} 
          onMobileToggle={() => setMobileOpen(true)} 
        />
        <div className="flex-1 mt-16 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
