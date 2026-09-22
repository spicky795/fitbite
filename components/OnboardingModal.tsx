'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateDailyTargets,
  Sex,
  ActivityLevel,
  FitnessGoal,
  ACTIVITY_LABELS,
} from '../lib/calorieEngine';
import { X, Check, SlidersHorizontal } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { profile, updateProfile, isOnboardingOpen, setIsOnboardingOpen } = useApp();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age || 25);
  const [sex, setSex] = useState<Sex>(profile.sex || 'male');
  const [heightCm, setHeightCm] = useState(profile.heightCm || 175);
  const [weightKg, setWeightKg] = useState(profile.weightKg || 75);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || 'moderate');
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal || 'lose');
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg || 70);

  useEffect(() => {
    if (isOnboardingOpen) {
      setName(profile.name);
      setAge(profile.age);
      setSex(profile.sex);
      setHeightCm(profile.heightCm);
      setWeightKg(profile.weightKg);
      setActivityLevel(profile.activityLevel);
      setGoal(profile.goal);
      setTargetWeightKg(profile.targetWeightKg || profile.weightKg - 5);
    }
  }, [isOnboardingOpen, profile]);

  if (!isOnboardingOpen) return null;

  const previewTargets = calculateDailyTargets(
    Number(weightKg) || 70,
    Number(heightCm) || 170,
    Number(age) || 25,
    sex,
    activityLevel,
    goal
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'User',
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
      targetWeightKg: Number(targetWeightKg),
      dailyCalorieTarget: previewTargets.targetCalories,
      dailyProteinTarget: previewTargets.proteinGrams,
      dailyCarbTarget: previewTargets.carbsGrams,
      dailyFatTarget: previewTargets.fatGrams,
    });
    setIsOnboardingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E9ECE9]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2F4F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F2FAD2] flex items-center justify-center text-[#2A3B0C]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111418]">Profile & Goal Targets</h2>
              <p className="text-[11px] text-[#737A80]">Mifflin-St Jeor BMR & TDEE engine</p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#737A80] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Personal Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#737A80] mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111418] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1">Sex</label>
                <div className="grid grid-cols-2 gap-1 bg-[#F4F6F4] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSex('male')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      sex === 'male' ? 'bg-white text-black shadow-xs' : 'text-[#737A80]'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('female')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      sex === 'female' ? 'bg-white text-black shadow-xs' : 'text-[#737A80]'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1">Age</label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-semibold text-[#111418] focus:outline-none text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-semibold text-[#111418] focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-semibold text-[#111418] focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-[#737A80] mb-1.5">Activity Level</label>
            <div className="space-y-1.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => {
                const item = ACTIVITY_LABELS[level];
                const isSelected = activityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActivityLevel(level)}
                    className={`w-full p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F2FAD2] border-[#C8EE44] text-[#111418] font-bold'
                        : 'bg-[#F8FAF8] border-[#EBEFEB] text-[#555C63] hover:bg-[#F2F5F2]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-[#737A80]">{item.multiplier}x</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-semibold text-[#737A80] mb-1.5">Primary Goal</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'lose', label: 'Lose Weight', sub: '-500 kcal' },
                { id: 'maintain', label: 'Maintain', sub: 'TDEE' },
                { id: 'gain', label: 'Gain Muscle', sub: '+350 kcal' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id as FitnessGoal)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    goal === g.id
                      ? 'bg-[#111418] text-white border-[#111418] font-bold'
                      : 'bg-[#F8FAF8] border-[#EBEFEB] text-[#555C63] hover:bg-[#F2F5F2]'
                  }`}
                >
                  <span className="text-xs block leading-tight">{g.label}</span>
                  <span className="text-[10px] opacity-70 block mt-0.5">{g.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Output Card */}
          <div className="p-3 bg-[#F4F6F4] rounded-2xl border border-[#E9ECE9] text-center space-y-1">
            <span className="text-[11px] font-semibold text-[#737A80] uppercase">Recommended Daily Target</span>
            <div className="text-2xl font-black text-[#111418]">
              {previewTargets.targetCalories} <span className="text-xs font-medium text-[#737A80]">kcal</span>
            </div>
            <p className="text-[11px] text-[#555C63]">
              Protein: <strong>{previewTargets.proteinGrams}g</strong> • Carbs: <strong>{previewTargets.carbsGrams}g</strong> • Fat: <strong>{previewTargets.fatGrams}g</strong>
            </p>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-full bg-[#D4F672] hover:bg-[#C2E84E] text-[#111418] font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              Save & Apply Daily Targets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
