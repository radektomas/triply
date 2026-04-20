import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-150 cursor-pointer select-none";
  const variants = {
    primary:
      "bg-accent text-white hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100",
    secondary:
      "bg-card text-[#1A1A1A] border border-border hover:bg-accent-light hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
