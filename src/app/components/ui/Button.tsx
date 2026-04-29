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
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants: Record<Variant, string> = {
      primary:
        "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-md hover:shadow-lg",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400",
      outline:
        "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-400",
      ghost:
        "text-gray-900 hover:bg-indigo-50 focus:ring-indigo-400",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-md hover:shadow-lg",
    };

    const sizes: Record<Size, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
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