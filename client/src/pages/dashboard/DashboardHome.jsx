import { useState, useEffect } from "react";
import { LayoutDashboard, AlertTriangle, AlertOctagon, PackageX, ChevronDown, ChevronUp, BellRing } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { get } from "@/services/api";
import { Card, EmptyState, LoadingSpinner } from "@/components/common";
import BDPerformanceCard from "@/components/dashboard/BDPerformanceCard";

export default function DashboardHome() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await get("/products/alerts");
        if (res.success) {
          setAlerts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, []);

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

      {/* Alert Banners */}
      {!loadingAlerts && alerts.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
            className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-lime/10 rounded-lg">
                <BellRing size={20} className="text-brand-lime" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-200">Inventory Alerts</h3>
                <p className="text-xs text-slate-400">
                  {alerts.length} action{alerts.length !== 1 ? "s" : ""} required
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {isAlertsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          
          {isAlertsExpanded && (
            <div className="p-4 pt-0 border-t border-slate-700/50 mt-4">
              <div className="flex flex-col gap-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      alert.type === "EXPIRED"
                        ? "bg-red-500/10 border-red-500/30 text-red-200"
                        : alert.type === "AT_RISK"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                        : "bg-slate-700/30 border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="mt-0.5">
                      {alert.type === "EXPIRED" && <AlertOctagon size={20} className="text-red-400" />}
                      {alert.type === "AT_RISK" && <AlertTriangle size={20} className="text-amber-400" />}
                      {alert.type === "DEPLETED" && <PackageX size={20} className="text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">
                        {alert.type === "EXPIRED" && "Product Expired"}
                        {alert.type === "AT_RISK" && "Expiry Risk Warning"}
                        {alert.type === "DEPLETED" && "Stock Depleted"}
                      </h3>
                      <p className="text-sm opacity-90">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
