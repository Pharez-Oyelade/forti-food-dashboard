import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, EmptyState } from '@/components/common';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-gray-100">
          Welcome back, <span className="text-brand-lime font-bold">{user?.name || 'User'}</span>
        </h2>
        <p className="text-gray-400">
          Here&rsquo;s what&rsquo;s happening at Forti Foods today.
        </p>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center border-dashed border-gray-700/50 bg-[#0e2a2c]/30">
        <EmptyState
          icon={LayoutDashboard}
          title="Dashboard Coming in Phase 5"
          description="KPI cards, charts, and live metrics will appear here. The dashboard will show inventory health, pipeline value, and key business indicators at a glance."
        />
      </Card>
    </div>
  );
}
