export default function Card({
  children,
  title,
  subtitle,
  className = "",
  hoverable = false,
  noPadding = false,
  headerAction,
  ...props
}) {
  const baseStyles =
    "bg-[#0e2a2c]/80 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-300 overflow-hidden";

  const classNames = [
    baseStyles,
    hoverable
      ? "hover:-translate-y-1 hover:shadow-2xl hover:border-brand-lime/40 hover:bg-[#0e2a2c]/90"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="flex justify-between items-start p-5 border-b border-brand-lime/10">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
