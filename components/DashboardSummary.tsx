'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Droplets, Flame, Plus, Minus } from 'lucide-react';

export const DashboardSummary: React.FC = () => {
  const { profile, selectedDate, getDailySummary } = useApp();
  const summary = getDailySummary(selectedDate);

  const [waterGlasses, setWaterGlasses] = useState(8);

  const calorieTarget = profile.dailyCalorieTarget || 2300;
  const consumedCalories = summary.totalCalories;
  const remainingCalories = calorieTarget - consumedCalories;
  const caloriePercent = Math.min(100, Math.round((consumedCalories / calorieTarget) * 100));

  const proteinTarget = profile.dailyProteinTarget || 150;
  const carbsTarget = profile.dailyCarbTarget || 260;
  const fatTarget = profile.dailyFatTarget || 70;

  const proteinPercent = Math.min(100, Math.round((summary.totalProtein / proteinTarget) * 100));
  const carbsPercent = Math.min(100, Math.round((summary.totalCarbs / carbsTarget) * 100));
  const fatPercent = Math.min(100, Math.round((summary.totalFat / fatTarget) * 100));

  // Circular progress SVG calculations
  const strokeWidth = 10;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercent / 100) * circumference;

  return (
    <div className="space-y-4 px-4 sm:px-6">
      {/* 1. Main Pastel Lime Progress Card (Matches Reference Image 1) */}
      <div className="bg-[#D9F47C] rounded-[28px] p-6 text-[#121518] shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[11px] font-semibold text-[#273212]">
              <Sparkles className="w-3 h-3 text-[#5A7C15]" />
              <span>Daily intake</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111417] leading-snug">
                Your Daily Progress
              </h2>
              <p className="text-xs font-medium text-[#465324] mt-0.5">
                {remainingCalories >= 0
                  ? `${remainingCalories.toLocaleString()} kcal remaining`
                  : `Over by ${Math.abs(remainingCalories).toLocaleString()} kcal`}
              </p>
            </div>

            <div className="pt-2 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#111417]">
                {consumedCalories.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-[#485626]">
                / {calorieTarget.toLocaleString()} kcal
              </span>
            </div>
          </div>

          {/* Clean Circular Gauge Ring (Matches Reference Image 1) */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#C5E35F"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Foreground progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#2B3614"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner White Center */}
            <div className="absolute w-18 h-18 rounded-full bg-white shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-[#121518] leading-none">
                {caloriePercent}%
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#737C85] mt-0.5">
                done
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Two Side-by-Side Quick Stat Cards (Matches Reference Image 1) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Step / Target Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#EBEFEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#737A80] block">Target Goal</span>
            <span className="text-lg font-bold text-[#111418] block mt-0.5">
              {calorieTarget.toLocaleString()} <span className="text-xs font-normal text-[#737A80]">kcal</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#FFF3E8] flex items-center justify-center text-[#D9651C]">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Drink Water Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#EBEFEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#737A80] block">Drink Water</span>
            <span className="text-lg font-bold text-[#111418] block mt-0.5">
              {waterGlasses} <span className="text-xs font-normal text-[#737A80]">glass</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWaterGlasses((prev) => Math.max(0, prev - 1))}
              className="w-7 h-7 rounded-full bg-[#F4F6F4] hover:bg-[#E8EDE8] flex items-center justify-center text-xs font-bold text-[#353A40] cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setWaterGlasses((prev) => prev + 1)}
              className="w-7 h-7 rounded-full bg-[#E5F3FC] hover:bg-[#D5EBFB] flex items-center justify-center text-xs font-bold text-[#0D62A5] cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Pastel Macro Cards (Matches Reference Image 2) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Carbs Card (Ice Blue) */}
        <div className="bg-[#EDF6FA] rounded-2xl p-3 border border-[#DCEBF2] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#245369]">Carbs</span>
            <span className="text-[10px] font-bold text-[#245369]">{carbsPercent}%</span>
          </div>
          <div>
            <div className="text-base font-bold text-[#143240]">
              {Math.round(summary.totalCarbs)} <span className="text-xs font-medium text-[#4D7182]">/ {carbsTarget}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#D7E8F0] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#277EA6] rounded-full transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Protein Card (Pastel Lime/Green) */}
        <div className="bg-[#F1F8D8] rounded-2xl p-3 border border-[#E0EFC0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#48631C]">Proteins</span>
            <span className="text-[10px] font-bold text-[#48631C]">{proteinPercent}%</span>
          </div>
          <div>
            <div className="text-base font-bold text-[#26370B]">
              {Math.round(summary.totalProtein)} <span className="text-xs font-medium text-[#5F782F]">/ {proteinTarget}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#DCECB5] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#6B9322] rounded-full transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fat Card (Pastel Peach) */}
        <div className="bg-[#FDF2E9] rounded-2xl p-3 border border-[#F6E1D1] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C4A1A]">Fats</span>
            <span className="text-[10px] font-bold text-[#8C4A1A]">{fatPercent}%</span>
          </div>
          <div>
            <div className="text-base font-bold text-[#4B2207]">
              {Math.round(summary.totalFat)} <span className="text-xs font-medium text-[#8F5B36]">/ {fatTarget}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#F3D7C1] rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#C26220] rounded-full transition-all duration-500"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
