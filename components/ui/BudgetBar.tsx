"use client";

import { useEffect, useState } from "react";

interface BudgetBarProps {
  label: string;
  amount: number;
  total: number;
  compact?: boolean;
}

export function BudgetBar({ label, amount, total, compact = false }: BudgetBarProps) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  if (compact) {
    return (
      <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold text-[#1A1A1A]">€{amount}</span>
      </div>
      <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
