export default function LoadingSpinner({ size = 'md', label, className = '' }) {
  const dims = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };
  const borders = {
    sm: "border-2",
    md: "border-[3px]",
    lg: "border-4"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${dims[size]}`}>
        <div className={`absolute inset-0 rounded-full border-brand-lime/20 ${borders[size]}`} />
        <div className={`absolute inset-0 rounded-full border-transparent border-t-brand-lime animate-spin ${borders[size]}`} />
      </div>
      {label && <p className="text-sm font-medium text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
}
