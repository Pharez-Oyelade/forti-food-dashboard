export default function LoadingSpinner({ size = 'md', label, className = '' }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        <div className={`absolute inset-0 rounded-full border-brand-lime/20 ${sizes[size]}`} />
        <div className={`absolute inset-0 rounded-full border-transparent border-t-brand-lime animate-spin ${sizes[size]}`} />
      </div>
      {label && <p className="text-sm font-medium text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
}
