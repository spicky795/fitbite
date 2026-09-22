'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, BarChart2, Plus, Scale, SlidersHorizontal } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { openAddModal, setIsOnboardingOpen, setIsWeightModalOpen } = useApp();

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 max-w-md mx-auto px-4 pointer-events-none">
      <nav className="bg-white/95 backdrop-blur-md rounded-full px-5 py-2.5 border border-[#E9ECE9] shadow-xl flex items-center justify-between pointer-events-auto">
        {/* Home */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[#111418] cursor-pointer"
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Progress / History */}
        <button
          onClick={() => {
            const el = document.getElementById('history-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 text-[#737A80] hover:text-[#111418] cursor-pointer transition-colors"
        >
          <BarChart2 className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium">Progress</span>
        </button>

        {/* Center Lime Floating Add Action (Matches Reference Image 1) */}
        <div className="-mt-7">
          <button
            onClick={() => openAddModal('lunch')}
            className="w-13 h-13 rounded-full bg-[#D4F672] hover:bg-[#C5E84A] text-[#111418] flex items-center justify-center shadow-lg shadow-[#D4F672]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-[#F4F6F4]"
            title="Add Food"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Log Weight */}
        <button
          onClick={() => setIsWeightModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[#737A80] hover:text-[#111418] cursor-pointer transition-colors"
        >
          <Scale className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium">Weight</span>
        </button>

        {/* Goal / Profile Settings */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[#737A80] hover:text-[#111418] cursor-pointer transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-medium">Goal</span>
        </button>
      </nav>
    </div>
  );
};
