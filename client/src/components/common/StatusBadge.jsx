const STATUS_MAP = {
  // Inventory statuses
  OK: 'green',
  Depleted: 'red',
  'Slow Mover': 'amber',
  'Expiry Risk': 'red',
  // RAG
  Red: 'red',
  Amber: 'amber',
  Green: 'green',
  // Severities
  warning: 'amber',
  critical: 'red',
  // Generic
  active: 'green',
  inactive: 'red',
  pending: 'amber',
};

const ROLE_COLOR = 'blue';

export default function StatusBadge({
  status,
  type = 'status',
  size = 'sm',
  className = '',
}) {
  let color;
  if (type === 'role') {
    color = ROLE_COLOR;
  } else {
    color = STATUS_MAP[status] || 'muted';
  }

  const baseStyles = "inline-flex items-center gap-1.5 font-medium rounded-full border";
  
  const colors = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    muted: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const dotColors = {
    green: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    red: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]",
    amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    blue: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]",
    muted: "bg-gray-400",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const classNames = [
    baseStyles,
    colors[color],
    sizes[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      <span className={`rounded-full flex-shrink-0 ${dotColors[color]} ${dotSizes[size]}`} />
      <span className="truncate">{status}</span>
    </span>
  );
}
