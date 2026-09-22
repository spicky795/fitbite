'use client';

import React from 'react';
import { useApp, getTodayDateString } from '../context/AppContext';
import { Calendar, SlidersHorizontal, Scale, Cloud } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    profile,
    selectedDate,
    setSelectedDate,
    setIsOnboardingOpen,
    setIsWeightModalOpen,
    setIsCloudModalOpen,
    isCloudConnected,
  } = useApp();

  const today = getTodayDateString();
  const isToday = selectedDate === today;

  const hour = new Date().getHours();
  let greeting = 'Good morning!';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon!';
  else if (hour >= 17) greeting = 'Good evening!';

  return (
    <header className="w-full pt-4 pb-2 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        {/* User Info & Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#E5E9E5] border-2 border-white shadow-xs flex items-center justify-center text-xs font-bold text-[#1F2327]">
            <span>{profile.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-[#7A828A] block leading-tight">
              {greeting}
            </span>
            <h1 className="text-[16px] font-bold text-[#121518] leading-snug">
              {profile.name}
            </h1>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={() => setIsCloudModalOpen(true)}
            className={`h-9 px-2.5 rounded-full border shadow-xs flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              isCloudConnected
                ? 'bg-[#F2FAD2] border-[#C8EE44] text-[#344F12]'
                : 'bg-white border-[#E9ECE9] text-[#7A828A] hover:text-[#111418]'
            }`}
            title={isCloudConnected ? "Cloud Sync Active (Firestore)" : "Setup Firebase Cloud Sync"}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isCloudConnected ? 'Sync' : 'Cloud'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-[#5B8814] animate-pulse' : 'bg-[#9CA3AF]'}`} />
          </button>

          {/* Quick Weight Badge */}
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="h-9 px-2.5 rounded-full bg-white border border-[#E9ECE9] shadow-xs hover:bg-[#F9FAF9] transition-colors flex items-center gap-1 text-[11px] font-semibold text-[#1C2024] cursor-pointer"
            title="Log weight"
          >
            <Scale className="w-3.5 h-3.5 text-[#7A828A]" />
            <span>{profile.weightKg} kg</span>
          </button>

          {/* Calendar Jump */}
          <button
            onClick={() => setSelectedDate(today)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer shadow-xs ${
              isToday
                ? 'bg-white border-[#E9ECE9] text-[#1C2024]'
                : 'bg-[#D4F672] border-[#D4F672] text-black font-bold'
            }`}
            title={isToday ? "Today" : "Jump to Today"}
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {/* Target Calculator / Settings */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="w-9 h-9 rounded-full bg-white border border-[#E9ECE9] shadow-xs flex items-center justify-center text-[#1C2024] hover:bg-[#F9FAF9] transition-colors cursor-pointer"
            title="Goals & Calculator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#353A40]" />
          </button>
        </div>
      </div>
    </header>
  );
};
