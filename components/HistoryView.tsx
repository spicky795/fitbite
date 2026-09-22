'use client';

import React from 'react';
import { useApp, getTodayDateString } from '../context/AppContext';
import { BarChart2 } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { profile, selectedDate, setSelectedDate, getDailySummary } = useApp();

  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      summary: getDailySummary(dateStr),
    };
  });

  const target = profile.dailyCalorieTarget || 2300;

  return (
    <div id="history-section" className="px-4 sm:px-6">
      <div className="bg-white rounded-2xl p-4 border border-[#EBEFEB] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#111418]" />
            <h3 className="text-sm font-bold text-[#111418]">Weekly Calorie Intake</h3>
          </div>
          <span className="text-xs font-medium text-[#737A80]">
            Target: {target} kcal
          </span>
        </div>

        {/* 7-Day Clean Bars */}
        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-32 border-b border-[#F2F4F2] pb-2.5">
          {past7Days.map((day) => {
            const cal = day.summary.totalCalories;
            const heightPercent = Math.min(100, Math.round((cal / (target * 1.2)) * 100));
            const isSelected = selectedDate === day.dateStr;
            const isOver = cal > target;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center justify-end h-full cursor-pointer transition-all ${
                  isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Bar */}
                <div className="w-full max-w-[24px] h-20 bg-[#F4F6F4] rounded-t-lg flex items-end justify-center overflow-hidden">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      cal === 0
                        ? 'h-1 bg-[#E0E5E0]'
                        : isOver
                        ? 'bg-[#F97316]'
                        : isSelected
                        ? 'bg-[#D4F672]'
                        : 'bg-[#B4D845]'
                    }`}
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`block text-[11px] mt-1.5 font-bold ${
                    isSelected ? 'text-[#111418]' : 'text-[#737A80]'
                  }`}
                >
                  {day.dayName.charAt(0)}
                </span>
                <span className="block text-[9px] text-[#8C9298]">
                  {cal > 0 ? cal : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
