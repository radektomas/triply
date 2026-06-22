"use client";

import type { CSSProperties } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type DateRange,
} from "react-day-picker";
import "react-day-picker/style.css";

// Isolated calendar surface. Pulled out of TripForm and loaded via next/dynamic
// (ssr:false) so react-day-picker + its stylesheet are NOT in the initial
// landing chunk — they load on demand when the user reaches the date step.

interface TripCalendarProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  /** Earliest selectable day (today). The parent only mounts this once set. */
  today: Date;
  /** Latest selectable day. */
  maxDate: Date | undefined;
  /** Double-click a day to clear the range. */
  onClear: () => void;
}

export function TripCalendar({
  selected,
  onSelect,
  today,
  maxDate,
  onClear,
}: TripCalendarProps) {
  const rdp = getDefaultClassNames();

  return (
    <DayPicker
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={1}
      weekStartsOn={1}
      disabled={{ before: today }}
      startMonth={today}
      endMonth={maxDate}
      showOutsideDays={false}
      defaultMonth={selected?.from ?? today}
      classNames={{
        root: rdp.root,
        month: `${rdp.month} w-full`,
        month_caption: `${rdp.month_caption} pb-3 flex justify-center`,
        caption_label: `${rdp.caption_label} text-[#1a1a1a] font-bold text-base`,
        button_previous: rdp.button_previous,
        button_next: rdp.button_next,
        chevron: rdp.chevron,
        weekday: `${rdp.weekday} text-[#1a1a1a]/40 text-xs font-semibold uppercase pb-2`,
        day: rdp.day,
      }}
      components={{
        DayButton: (props) => (
          <TriplyDayButton
            {...props}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
          />
        ),
      }}
    />
  );
}

function TriplyDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
  const isRangeStart = !!modifiers.range_start;
  const isRangeEnd = !!modifiers.range_end;
  const isRangeMiddle = !!modifiers.range_middle;
  const isSelected = !!modifiers.selected;
  const isToday = !!modifiers.today;
  const isDisabled = !!modifiers.disabled;
  const isOutside = !!modifiers.outside;
  const isSingleDay = isRangeStart && isRangeEnd;

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      !isSingleDay && (isRangeStart || isRangeEnd || isRangeMiddle)
        ? "rgba(255, 107, 71, 0.15)"
        : "transparent",
    borderTopLeftRadius: isRangeStart && !isSingleDay ? "9999px" : isRangeMiddle || isRangeEnd ? "0" : "9999px",
    borderBottomLeftRadius: isRangeStart && !isSingleDay ? "9999px" : isRangeMiddle || isRangeEnd ? "0" : "9999px",
    borderTopRightRadius: isRangeEnd && !isSingleDay ? "9999px" : isRangeMiddle || isRangeStart ? "0" : "9999px",
    borderBottomRightRadius: isRangeEnd && !isSingleDay ? "9999px" : isRangeMiddle || isRangeStart ? "0" : "9999px",
  };

  const isEndpoint = isRangeStart || isRangeEnd || (isSelected && !isRangeMiddle);

  const buttonStyle: CSSProperties = {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    fontWeight: isEndpoint ? 600 : isToday ? 700 : 500,
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "background-color 150ms, color 150ms",
    border: isToday && !isEndpoint ? "2px solid rgba(13, 115, 119, 0.5)" : "none",
    backgroundColor: isEndpoint ? "#FF6B47" : "transparent",
    color: isEndpoint ? "#ffffff" : isToday && !isEndpoint ? "#0D7377" : "#1a1a1a",
    opacity: isDisabled || isOutside ? 0.3 : 1,
    position: "relative",
    flexShrink: 0,
  };

  const showTooltip = (isSelected || isRangeStart || isRangeEnd || isRangeMiddle) && !isDisabled;

  return (
    <div style={containerStyle}>
      <button
        {...buttonProps}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!isEndpoint && !isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(13, 115, 119, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isEndpoint && !isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }
        }}
      >
        {day.date.getDate()}
      </button>
      {showTooltip && (
        <span
          className="triply-tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1a1a1a",
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 150ms",
            zIndex: 50,
          }}
        >
          Double-click to clear
        </span>
      )}
    </div>
  );
}
