import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'outline' | 'filled';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'glass',
  ...props 
}) => {
  const baseStyles = "rounded-xl p-5 transition-all duration-200 relative overflow-hidden";
  const variants = {
    default: "bg-surface border border-slate-700 shadow-md",
    glass: "glass-panel shadow-xl shadow-black/20 hover:border-slate-600/50",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800/30",
    filled: "bg-slate-800/80 border border-slate-700/50"
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
