"use client";

import { BudgetBar } from "@/components/ui/BudgetBar";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { APIEstimates } from "@/lib/types";

interface Props {
  estimates: APIEstimates;
  nights: number;
}

export function EstimatesBreakdown({ estimates, nights }: Props) {
  const { format } = useCurrency();
  const { flightRange, hotelPerNightRange, foodPerDay, activitiesPerDay, localTransportPerDay, totalEstimate } = estimates;

  const hotelTotal = hotelPerNightRange.typical * nights;
  const foodTotal = foodPerDay.midRange * nights;
  const activitiesTotal = activitiesPerDay.midRange * nights;
  const transportTotal = localTransportPerDay * nights;
  const total = totalEstimate.typical;

  const fmt = (eur: number) => format(eur, { rounded: true });

  const rows = [
    {
      label: "Flights",
      sub: `${fmt(flightRange.min)}–${fmt(flightRange.max)} range`,
      amount: flightRange.typical,
    },
    {
      label: "Hotel",
      sub: `${fmt(hotelPerNightRange.typical)}/night × ${nights}`,
      amount: hotelTotal,
    },
    {
      label: "Food",
      sub: `${fmt(foodPerDay.midRange)}/day × ${nights}`,
      amount: foodTotal,
    },
    {
      label: "Activities",
      sub: `${fmt(activitiesPerDay.midRange)}/day × ${nights}`,
      amount: activitiesTotal,
    },
    {
      label: "Transport",
      sub: `${fmt(localTransportPerDay)}/day × ${nights}`,
      amount: transportTotal,
    },
  ];

  return (
    <div className="space-y-4">
      {rows.map(({ label, sub, amount }) => (
        <div key={label}>
          <div className="flex justify-between items-baseline mb-1.5">
            <div>
              <span className="text-sm font-medium text-[#1A1A1A]">{label}</span>
              <span className="text-xs text-muted ml-2">{sub}</span>
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(amount)}</span>
          </div>
          <BudgetBar label="" amount={amount} total={total} compact />
        </div>
      ))}
      <div className="flex justify-between items-center mt-5 pt-4 border-t border-border">
        <span className="text-sm font-semibold text-muted uppercase tracking-widest">
          Total
        </span>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1A1A1A]">{fmt(totalEstimate.typical)}</p>
          <p className="text-xs text-muted">{fmt(totalEstimate.min)}–{fmt(totalEstimate.max)} range</p>
        </div>
      </div>
    </div>
  );
}
