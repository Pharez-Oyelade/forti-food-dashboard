import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center animate-[fadeIn_0.4s_ease-out] ${className}`}>
      <div className="w-20 h-20 rounded-full bg-[#0e2a2c] text-brand-lime/70 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border border-brand-lime/10">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
      {description && <p className="text-gray-400 max-w-sm mb-8">{description}</p>}
      {actionLabel && onAction && (
        <div>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
