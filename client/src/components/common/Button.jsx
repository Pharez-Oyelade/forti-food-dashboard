import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    className = '',
    id,
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-deepest disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-lime text-brand-dark hover:bg-[#c4cf5b] active:scale-[0.98] shadow-lg focus:ring-brand-lime",
    secondary: "bg-gray-800 text-gray-200 hover:bg-gray-700 active:scale-[0.98] border border-gray-700 focus:ring-gray-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/50 focus:ring-red-500",
    ghost: "bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:ring-gray-600"
  };

  const sizes = {
    sm: "text-xs py-1.5 px-3 gap-1.5",
    md: "text-sm py-2 px-4 gap-2",
    lg: "text-base py-2.5 px-5 gap-2.5"
  };

  const classNames = [
    baseStyles,
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      ref={ref}
      id={id}
      type={type}
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={iconSize} />
      ) : Icon ? (
        <Icon size={iconSize} />
      ) : null}
      
      {children && <span>{children}</span>}
      
      {IconRight && !loading && (
        <IconRight size={iconSize} />
      )}
    </button>
  );
});

export default Button;
