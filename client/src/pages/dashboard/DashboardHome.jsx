import { LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, EmptyState } from "@/components/common";
import BDPerformanceCard from "@/components/dashboard/BDPerformanceCard";

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-gray-100">
          Welcome back,{" "}
          <span className="text-brand-lime font-bold">
            {user?.name || "User"}
          </span>
        </h2>
        <p className="text-gray-400">
          Here&rsquo;s what&rsquo;s happening at Forti Foods today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[400px] flex items-center justify-center border-dashed border-gray-700/50 bg-[#0e2a2c]/30">
          <EmptyState
            icon={LayoutDashboard}
            title="Dashboard in Sprint 5"
            description="KPI cards, charts, and live metrics"
          />
        </Card>

        <div>
          <BDPerformanceCard />
        </div>
      </div>
    </div>
  );
}
