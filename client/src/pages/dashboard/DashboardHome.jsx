import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, AlertTriangle, AlertOctagon, PackageX, PackageMinus, ChevronDown, ChevronUp, BellRing, Target, TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { get } from "@/services/api";
import { Card, LoadingSpinner } from "@/components/common";
import BDPerformanceCard from "@/components/dashboard/BDPerformanceCard";

export default function DashboardHome() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [alertsRes, summaryRes] = await Promise.all([
          get("/products/alerts"),
          get("/dashboard/summary")
        ]);
        
        if (alertsRes.success) setAlerts(alertsRes.data);
        if (summaryRes.success) setSummary(summaryRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoadingAlerts(false);
        setLoadingSummary(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => val != null ? `₦${val.toLocaleString()}` : "₦0";

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
                        : alert.type === "REORDER"
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
                        : "bg-slate-700/30 border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="mt-0.5">
                      {alert.type === "EXPIRED" && <AlertOctagon size={20} className="text-red-400" />}
                      {alert.type === "AT_RISK" && <AlertTriangle size={20} className="text-amber-400" />}
                      {alert.type === "DEPLETED" && <PackageX size={20} className="text-slate-400" />}
                      {alert.type === "REORDER" && <PackageMinus size={20} className="text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">
                        {alert.type === "EXPIRED" && "Product Expired"}
                        {alert.type === "AT_RISK" && "Expiry Risk Warning"}
                        {alert.type === "DEPLETED" && "Stock Depleted"}
                        {alert.type === "REORDER" && "Reorder Recommended"}
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

      {/* KPI Command Center */}
      {loadingSummary ? (
        <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Target size={20} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                Pipeline
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mt-4">Weighted Pipeline</h3>
            <p className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(summary?.pipeline?.weighted_value)}</p>
            <p className="text-xs text-slate-500 mt-1">{summary?.pipeline?.total_deals || 0} Open Deals</p>
          </Card>

          <Card className="hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                Inventory
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mt-4">Value At Risk</h3>
            <p className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(summary?.inventory?.risk_value)}</p>
            <p className="text-xs text-slate-500 mt-1">{summary?.inventory?.risk_items || 0} SKUs Affected</p>
          </Card>

          <Card className="hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity size={20} className="text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                Social
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mt-4">Engagement Rate</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-100">{summary?.social?.engagement_rate?.toFixed(2) || "0.00"}%</p>
              {summary?.social?.engagement_delta !== 0 && (
                <span className={`text-xs font-medium flex items-center ${summary.social.engagement_delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {summary.social.engagement_delta > 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                  {Math.abs(summary.social.engagement_delta).toFixed(2)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">vs previous week</p>
          </Card>

          <Link to="/app/gaps" className="block outline-none hover:-translate-y-1 transition-transform">
            <Card className="hover:border-purple-500/50 hover:bg-slate-800/80 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Briefcase size={20} className="text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                  Insights
                </span>
              </div>
              <h3 className="text-slate-400 text-sm font-medium mt-4">Open Gaps</h3>
              <p className="text-2xl font-bold text-slate-100 mt-1">{summary?.gaps?.open_count || 0}</p>
              <p className="text-xs text-purple-400/80 mt-1 flex items-center gap-1 hover:text-purple-400">View details &rarr;</p>
            </Card>
          </Link>
        </div>
      )}

      {/* Advanced Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div>
          <BDPerformanceCard />
        </div>
        
        <div className="flex flex-col gap-6">
          <Card title="Meals Delivered (Meal Mate)" className="h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Impact</p>
                <div className="text-4xl font-bold text-brand-lime">
                  {summary?.programs?.meals_delivered?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Across {summary?.programs?.active_schools || 0} active schools
                </p>
              </div>
              <div className="w-24 h-24 rounded-full border-8 border-brand-lime/20 flex items-center justify-center">
                <Users size={32} className="text-brand-lime" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
