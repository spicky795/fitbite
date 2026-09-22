'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Scale, Check } from 'lucide-react';

export const WeightModal: React.FC = () => {
  const {
    isWeightModalOpen,
    setIsWeightModalOpen,
    profile,
    logWeight,
    weightHistory,
    selectedDate,
  } = useApp();

  const [weightInput, setWeightInput] = useState<string>(profile.weightKg.toString());

  if (!isWeightModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!isNaN(w) && w > 20 && w < 300) {
      logWeight(w, selectedDate);
      setIsWeightModalOpen(false);
    }
  };

  const diffToGoal = profile.targetWeightKg ? (profile.weightKg - profile.targetWeightKg).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl overflow-hidden border border-[#E9ECE9]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2F4F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F2FAD2] flex items-center justify-center text-[#2A3B0C]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111418]">Log Weight</h2>
              <p className="text-[11px] text-[#737A80]">{selectedDate}</p>
            </div>
          </div>

          <button
            onClick={() => setIsWeightModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#737A80] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#737A80] mb-1.5 text-center">
                Current Weight (kg)
              </label>
              <div className="relative max-w-[160px] mx-auto">
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-2xl px-4 py-3 text-3xl font-black text-[#111418] text-center focus:outline-none"
                />
              </div>
            </div>

            {profile.targetWeightKg && (
              <div className="p-2.5 bg-[#F4F6F4] rounded-xl text-center text-xs text-[#555C63]">
                Target: <strong>{profile.targetWeightKg} kg</strong>
                {diffToGoal && parseFloat(diffToGoal) !== 0 && (
                  <span className="block text-[11px] text-[#2F6B12] mt-0.5">
                    {Math.abs(parseFloat(diffToGoal))} kg left to reach goal
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-full bg-[#D4F672] hover:bg-[#C2E84E] text-[#111418] font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              Save Weight
            </button>
          </form>

          {/* Recent History */}
          <div className="space-y-1.5 pt-2 border-t border-[#F2F4F2]">
            <span className="text-[11px] font-bold text-[#8C9298] uppercase block">
              Recent entries
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {weightHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAF8] text-xs text-[#555C63]"
                >
                  <span>{item.date}</span>
                  <strong className="text-[#111418]">{item.weightKg} kg</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
