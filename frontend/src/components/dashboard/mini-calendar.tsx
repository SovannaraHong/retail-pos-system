"use client";

import { useMemo } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MiniCalendar() {
  const { label, cells } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const items: {
      day: number;
      current: boolean;
      sunday: boolean;
      today: boolean;
    }[] = [];

    for (let i = 0; i < 42; i++) {
      const offset = i - firstWeekday + 1;
      const current = offset >= 1 && offset <= daysInMonth;
      const day = current
        ? offset
        : offset < 1
          ? daysInPrev + offset
          : offset - daysInMonth;

      items.push({
        day,
        current,
        sunday: i % 7 === 6,
        today: current && day === now.getDate(),
      });
    }

    return {
      label: now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      cells: items,
    };
  }, []);

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold text-[#1c2740]">
        {label}
      </p>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1 font-semibold text-[#1c2740]">
            {day}
          </span>
        ))}

        {cells.map((cell, index) => (
          <span
            key={index}
            className={`mx-auto flex h-6 w-6 items-center justify-center rounded text-[11px] ${
              cell.today
                ? "bg-[#1d5fe0] font-semibold text-white"
                : !cell.current
                  ? "text-[#c5cddb]"
                  : cell.sunday
                    ? "text-red-500"
                    : "text-[#3d4a63]"
            }`}
          >
            {cell.day}
          </span>
        ))}
      </div>
    </div>
  );
}
