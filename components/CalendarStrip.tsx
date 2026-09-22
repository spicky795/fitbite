'use client';

import React from 'react';
import { useApp, getTodayDateString } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarStrip: React.FC = () => {
  const { selectedDate, setSelectedDate } = useApp();

  const currentDateObj = new Date(selectedDate);
  const monthYearLabel = currentDateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Generate current week (Sunday to Saturday) around selected date
  const startOfWeek = new Date(currentDateObj);
  const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return {
      dateStr,
      dayLetter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
      dayNumber: String(d.getDate()).padStart(2, '0'),
      isToday: dateStr === getTodayDateString(),
      isSelected: dateStr === selectedDate,
    };
  });

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    const d = String(prev.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  return (
    <div className="px-4 sm:px-6">
      <div className="bg-white rounded-2xl p-4 border border-[#EBEFEB] shadow-xs space-y-3">
        {/* Month Header with chevrons (Matches Reference Image 1) */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111418]">
            {monthYearLabel}
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="w-7 h-7 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#4B5259] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="w-7 h-7 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#4B5259] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Strip S M T W T F S */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className="flex flex-col items-center py-1 cursor-pointer transition-all group"
            >
              <span className="text-[11px] font-semibold text-[#8C939A] mb-1 group-hover:text-black">
                {day.dayLetter}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all ${
                  day.isSelected
                    ? 'bg-[#D4F672] text-[#111418] font-bold shadow-xs'
                    : 'text-[#2D3339] hover:bg-[#F0F2F0]'
                }`}
              >
                {day.dayNumber}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
