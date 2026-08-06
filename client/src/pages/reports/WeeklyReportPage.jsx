import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get } from "@/services/api";
import { Card, LoadingSpinner } from "@/components/common";
import { SECTIONS } from "../../../../shared/constants";
import { toast } from "react-toastify";

export default function WeeklyReportPage() {
  const { canRead, hasPermission } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await get("/reports/weekly-summary");
        setReport(res.data);
      } catch (err) {
        toast.error("Failed to load weekly report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const formatCurrency = (val) =>
    val != null ? `₦${val.toLocaleString()}` : "-";

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (!report) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Weekly Management Report
          </h1>
          <p className="text-slate-400 mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-brand-lime text-brand-dark font-medium rounded-lg hover:bg-[#c4cf66] transition-colors print:hidden"
        >
          Export / Print
        </button>
      </div>

      <div className="print:text-black space-y-8">
        {canRead(SECTIONS.PIPELINE) && report.pipeline && (
          <section>
            <h2 className="text-xl font-semibold text-brand-lime mb-4 print:text-brand-dark border-b border-slate-700 pb-2">
              Pipeline Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Total Active Deals
                </div>
                <div className="text-2xl font-bold text-slate-100 print:text-black">
                  {report.pipeline.total_deals}
                </div>
              </Card>
              {!hasPermission(SECTIONS.PIPELINE, "view_restricted", true) &&
                report.pipeline.total_value !== undefined && (
                  <>
                    <Card className="print:border print:border-gray-300 print:shadow-none">
                      <div className="text-sm text-slate-400 print:text-gray-500">
                        Pipeline Value
                      </div>
                      <div className="text-2xl font-bold text-slate-100 print:text-black">
                        {formatCurrency(report.pipeline.total_value)}
                      </div>
                    </Card>
                    <Card className="print:border print:border-gray-300 print:shadow-none">
                      <div className="text-sm text-slate-400 print:text-gray-500">
                        Weighted Forecast
                      </div>
                      <div className="text-2xl font-bold text-emerald-400 print:text-emerald-700">
                        {formatCurrency(report.pipeline.weighted_value)}
                      </div>
                    </Card>
                  </>
                )}
            </div>
          </section>
        )}

        {canRead(SECTIONS.INVENTORY) && report.inventory && (
          <section>
            <h2 className="text-xl font-semibold text-brand-lime mb-4 print:text-brand-dark border-b border-slate-700 pb-2">
              Inventory Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Total SKUs
                </div>
                <div className="text-2xl font-bold text-slate-100 print:text-black">
                  {report.inventory.total_skus}
                </div>
              </Card>
              {!hasPermission(SECTIONS.INVENTORY, "view_restricted", true) &&
                report.inventory.total_stock_value !== undefined && (
                  <Card className="print:border print:border-gray-300 print:shadow-none">
                    <div className="text-sm text-slate-400 print:text-gray-500">
                      Stock Value
                    </div>
                    <div className="text-2xl font-bold text-slate-100 print:text-black">
                      {formatCurrency(report.inventory.total_stock_value)}
                    </div>
                  </Card>
                )}
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Depleted Items
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {report.inventory.depleted_count}
                </div>
              </Card>
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Expiry Risks
                </div>
                <div className="text-2xl font-bold text-amber-500">
                  {report.inventory.expiry_risks}
                </div>
              </Card>
            </div>
          </section>
        )}

        {canRead(SECTIONS.MEALMATE) && report.programs && (
          <section>
            <h2 className="text-xl font-semibold text-brand-lime mb-4 print:text-brand-dark border-b border-slate-700 pb-2">
              Programs (Meal Mate)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Meals Delivered
                </div>
                <div className="text-2xl font-bold text-slate-100 print:text-black">
                  {report.programs.meals_delivered.toLocaleString()}
                </div>
              </Card>
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Active Schools
                </div>
                <div className="text-2xl font-bold text-emerald-400 print:text-emerald-700">
                  {report.programs.active_schools}
                </div>
              </Card>
            </div>
          </section>
        )}

        {canRead(SECTIONS.SOCIAL) && report.social && (
          <section>
            <h2 className="text-xl font-semibold text-brand-lime mb-4 print:text-brand-dark border-b border-slate-700 pb-2">
              Social Media Engagement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Current Engagement Rate
                </div>
                <div className="text-2xl font-bold text-slate-100 print:text-black">
                  {report.social.engagement_rate}%
                </div>
              </Card>
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  WoW Delta
                </div>
                <div className={`text-2xl font-bold ${report.social.engagement_delta >= 0 ? "text-emerald-400 print:text-emerald-700" : "text-red-500 print:text-red-700"}`}>
                  {report.social.engagement_delta > 0 ? "+" : ""}{report.social.engagement_delta.toFixed(2)}%
                </div>
              </Card>
            </div>
          </section>
        )}

        {canRead(SECTIONS.BUSINESS_GAPS) && report.gaps && (
          <section>
            <h2 className="text-xl font-semibold text-brand-lime mb-4 print:text-brand-dark border-b border-slate-700 pb-2">
              Business Gaps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <div className="text-sm text-slate-400 print:text-gray-500">
                  Open Action Items
                </div>
                <div className="text-2xl font-bold text-amber-500 print:text-amber-700">
                  {report.gaps.open_count}
                </div>
              </Card>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .bg-slate-900 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
