import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/common';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark gap-6 text-center p-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        <ShieldX size={48} strokeWidth={1.5} className="text-red-500" />
      </div>
      <div>
        <h1 className="text-5xl font-bold text-gray-100 tracking-tight mb-2">403</h1>
        <p className="text-base text-gray-400 max-w-sm mx-auto">
          You don&rsquo;t have permission to access this page. Contact your
          administrator if you believe this is an error.
        </p>
      </div>
      <Link to="/app/dashboard">
        <Button variant="secondary" id="forbidden-back-btn">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
