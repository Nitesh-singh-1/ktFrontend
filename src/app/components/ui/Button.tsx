// src/components/ui/Button.tsx
import React, { forwardRef } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";

    const variants: Record<Variant, string> = {
      primary:
        "bg-[#47868C] hover:bg-[#3F7C82] active:bg-[#356B70] text-white focus:ring-[#47868C]/30 shadow-xs hover:shadow min-w-[120px]",
      secondary:
        "bg-white dark:bg-slate-900 text-[#3F7C82] dark:text-slate-200 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 active:bg-[#D8EAEC] border border-[#D9E2E3] dark:border-slate-700 focus:ring-[#47868C]/20 shadow-2xs min-w-[100px]",
      outline:
        "bg-transparent text-[#47868C] hover:bg-[#E7F1F2] dark:hover:bg-slate-800 border border-[#47868C] focus:ring-[#47868C]/30 min-w-[100px]",
      ghost:
        "text-[#64748B] hover:text-[#111827] dark:hover:text-white hover:bg-[#E7F1F2] dark:hover:bg-slate-800 focus:ring-[#47868C]/20",
      danger:
        "bg-[#D95C5C] hover:bg-[#C54A4A] active:bg-[#B23C3C] text-white focus:ring-[#D95C5C]/30 shadow-xs min-w-[100px]",
    };

    const sizes: Record<Size, string> = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`
          ${base}
          ${variants[variant]}
          ${sizes[size]}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}

        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;