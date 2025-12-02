import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'outline' | 'filled' | 'neon';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  hoverEffect = false,
  ...props 
}) => {
  const baseStyles = "rounded-3xl p-6 transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    default: "bg-white dark:bg-card border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-2xl shadow-black/5 dark:shadow-black/40",
    glass: "glass-panel shadow-xl shadow-black/20",
    outline: "border border-slate-200 dark:border-white/10 bg-transparent",
    filled: "bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-white/5",
    neon: "bg-gradient-to-br from-[#1A1A24] to-[#13131A] border border-white/10 shadow-neon"
  };

  const hoverStyles = hoverEffect 
    ? "hover:border-primary/20 dark:hover:border-white/10 hover:shadow-glow hover:-translate-y-1 hover:bg-slate-50 dark:hover:bg-[#1A1A23]" 
    : "";

  return (
    <div className={cn(baseStyles, variants[variant], hoverStyles, className)} {...props}>
      {/* Subtle top gradient line for 3D effect (Dark mode only) */}
      <div className="hidden dark:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      {/* Subtle radial gradient background for depth (Dark mode only) */}
      <div className="hidden dark:block absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};