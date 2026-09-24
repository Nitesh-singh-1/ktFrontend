// src/components/ui/Card.tsx
import React from "react";

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export default function Card({
  title,
  subtitle,
  action,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  children,
}: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-shadow duration-200 ${className}`}>
      {(title || action) && (
        <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${headerClassName}`}>
          <div>
            {typeof title === "string" ? (
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}