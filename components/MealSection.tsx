'use client';

import React from 'react';
import { useApp, MealType } from '../context/AppContext';
import { Plus, X, Flame } from 'lucide-react';

interface MealConfig {
  type: MealType;
  title: string;
  rangeHint: string;
}

const MEAL_CONFIGS: MealConfig[] = [
  { type: 'breakfast', title: 'Breakfast', rangeHint: '400 - 500 kcal' },
  { type: 'lunch', title: 'Lunch time', rangeHint: '550 - 700 kcal' },
  { type: 'snack', title: 'Snacks & Drinks', rangeHint: '150 - 250 kcal' },
  { type: 'dinner', title: 'Dinner', rangeHint: '500 - 650 kcal' },
];

export const MealSection: React.FC = () => {
  const { logs, selectedDate, getDailySummary, openAddModal, deleteFoodLog } = useApp();
  const summary = getDailySummary(selectedDate);
  const dayLogs = logs.filter((log) => log.date === selectedDate);

  return (
    <div className="space-y-3 px-4 sm:px-6">
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-bold text-[#111418]">Today Meals</h2>
        <span className="text-xs font-semibold text-[#737A80]">
          Total: <strong className="text-[#111418]">{summary.totalCalories} kcal</strong>
        </span>
      </div>

      <div className="space-y-2.5">
        {MEAL_CONFIGS.map((meal) => {
          const mealItems = dayLogs.filter((item) => item.mealType === meal.type);
          const mealCalories = summary.mealCalories[meal.type] || 0;

          return (
            <div
              key={meal.type}
              className="bg-white rounded-2xl p-4 border border-[#EBEFEB] shadow-xs transition-all hover:border-[#DFE4DF]"
            >
              {/* Meal Header Row (Matches Reference Image 1 & 2) */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111418]">{meal.title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#737A80]">
                    <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>
                      {mealCalories > 0 ? `${mealCalories} kcal` : meal.rangeHint}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {mealItems.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F4] text-[#555C63]">
                      {mealItems.length} {mealItems.length === 1 ? 'item' : 'items'}
                    </span>
                  )}
                  <button
                    onClick={() => openAddModal(meal.type)}
                    className="w-8 h-8 rounded-full bg-[#F4F6F4] hover:bg-[#D4F672] text-[#111418] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                    title={`Add food to ${meal.title}`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Logged Food Items */}
              {mealItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#F2F4F2] space-y-2">
                  {mealItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAF9] hover:bg-[#F2F5F2] transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1C2024] truncate">
                            {item.foodName}
                          </h4>
                          <span className="text-[11px] font-medium text-[#737A80]">
                            {item.quantity} {item.unitLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#828A91] mt-0.5 flex items-center gap-2">
                          <span>P: {item.protein}g</span>
                          <span>•</span>
                          <span>C: {item.carbs}g</span>
                          <span>•</span>
                          <span>F: {item.fat}g</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-[#111418]">
                          {item.calories} kcal
                        </span>
                        <button
                          onClick={() => deleteFoodLog(item.id)}
                          className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
