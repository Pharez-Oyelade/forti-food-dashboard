import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/common';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark gap-6 text-center p-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
        <FileQuestion size={48} strokeWidth={1.5} className="text-gray-400" />
      </div>
      <div>
        <h1 className="text-5xl font-bold text-gray-100 tracking-tight mb-2">404</h1>
        <p className="text-base text-gray-400 max-w-sm mx-auto">
          Page not found. It may have been moved or doesn&rsquo;t exist.
        </p>
      </div>
      <Link to="/app/dashboard">
        <Button variant="secondary" id="not-found-back-btn">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
