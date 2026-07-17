import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/common";

export default function TopBar({ title, collapsed }) {
  const { user, logout } = useAuth();

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#0e2a2c]/80 backdrop-blur-md border-b border-brand-lime/10 flex items-center justify-between px-6 z-30 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        collapsed ? "left-[72px]" : "left-[260px]"
      }`}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300 hidden md:block">
            {user?.name}
          </span>
          {user?.role?.role_name && (
            <StatusBadge status={user.role.role_name} type="role" size="sm" />
          )}
        </div>

        <div className="h-6 w-px bg-gray-700/50 mx-1" />

        <button
          className="p-0 md:p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
          onClick={logout}
          id="topbar-logout-btn"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
