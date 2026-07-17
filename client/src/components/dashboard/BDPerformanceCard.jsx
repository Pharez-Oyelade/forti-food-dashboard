import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get } from '@/services/api';
import { Card, LoadingSpinner } from '@/components/common';
import { SECTIONS } from '../../../../shared/constants';
import { toast } from 'react-toastify';

export default function BDPerformanceCard() {
  const { hasPermission, canRead } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if they have pipeline view access
    if (!canRead(SECTIONS.PIPELINE)) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const res = await get('/metrics/performance');
        setMetrics(res.data || []);
      } catch (err) {
        toast.error('Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [canRead]);

  const formatCurrency = (val) => val != null ? `₦${val.toLocaleString()}` : '-';
  const canSeeMoney = !hasPermission(SECTIONS.PIPELINE, 'view_restricted', true);

  if (!canRead(SECTIONS.PIPELINE)) return null;
  if (loading) return <Card className="flex justify-center p-6"><LoadingSpinner size="md" /></Card>;

  return (
    <Card title="BD Performance Leaderboard" className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
            <th className="p-3">Rep</th>
            <th className="p-3 text-right">Total Deals</th>
            <th className="p-3 text-right">Won</th>
            <th className="p-3 text-right">Win Rate</th>
            <th className="p-3 text-right">Avg Cycle</th>
            {canSeeMoney && <th className="p-3 text-right">Value Won</th>}
          </tr>
        </thead>
        <tbody>
          {metrics.length === 0 ? (
            <tr><td colSpan={canSeeMoney ? "6" : "5"} className="p-4 text-center text-slate-500 text-sm">No performance data yet</td></tr>
          ) : (
            metrics.sort((a,b) => b.wonDeals - a.wonDeals).map(stat => (
              <tr key={stat.userId} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors text-sm">
                <td className="p-3 font-medium text-slate-200">{stat.name}</td>
                <td className="p-3 text-right text-slate-400">{stat.totalDeals}</td>
                <td className="p-3 text-right font-medium text-emerald-400">{stat.wonDeals}</td>
                <td className="p-3 text-right">{stat.conversionRate}%</td>
                <td className="p-3 text-right text-slate-400">{stat.avgDaysToClose > 0 ? `${stat.avgDaysToClose}d` : '-'}</td>
                {canSeeMoney && <td className="p-3 text-right font-medium text-slate-200">{formatCurrency(stat.totalValue)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
