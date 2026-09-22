'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp, MealType } from '../context/AppContext';
import { FOOD_DATABASE, FoodItem } from '../data/foodDatabase';
import { calculateNutrients, NutrientBreakdown } from '../lib/calorieEngine';
import { Search, X, ChevronLeft, ChevronDown, Check, Plus, Minus } from 'lucide-react';

export const AddFoodModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeAddModal,
    activeMealType,
    selectedDate,
    addFoodLog,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('g');
  const [quantity, setQuantity] = useState<number>(1);
  const [mealType, setMealType] = useState<MealType>(activeMealType);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      setMealType(activeMealType);
      setSelectedFood(null);
      setSearchQuery('');
      setSelectedCategory('All');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isAddModalOpen, activeMealType]);

  useEffect(() => {
    if (selectedFood) {
      const defaultServing = selectedFood.servings.find((s) => s.isDefault) || selectedFood.servings[0];
      setSelectedUnitId(defaultServing ? defaultServing.id : 'g');
      setQuantity(defaultServing?.id === 'g' ? 100 : 1);
    }
  }, [selectedFood]);

  const categories = ['All', 'Breakfast', 'Curry & Dal', 'Bread & Rice', 'Protein', 'Dairy', 'Snack & Sweet', 'Fruit & Veg', 'Beverage'];

  const filteredFoods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FOOD_DATABASE.filter((food) => {
      const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;
      if (food.name.toLowerCase().includes(query)) return true;
      if (food.aliases.some((alias) => alias.toLowerCase().includes(query))) return true;
      if (food.region?.toLowerCase().includes(query)) return true;
      if (food.category.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [searchQuery, selectedCategory]);

  const calculatedNutrients: NutrientBreakdown = useMemo(() => {
    if (!selectedFood) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 };
    }
    return calculateNutrients(selectedFood, quantity, selectedUnitId);
  }, [selectedFood, quantity, selectedUnitId]);

  if (!isAddModalOpen) return null;

  const handleStepQuantity = (delta: number) => {
    setQuantity((prev) => {
      const step = selectedUnitId === 'g' ? 25 : 1;
      const next = prev + delta * step;
      return next > 0 ? next : prev;
    });
  };

  const handleSaveToLog = () => {
    if (!selectedFood) return;
    const servingObj = selectedFood.servings.find((s) => s.id === selectedUnitId);
    const unitLabel = servingObj ? servingObj.name : 'g';

    addFoodLog({
      date: selectedDate,
      mealType: mealType,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: quantity,
      unitId: selectedUnitId,
      unitLabel: unitLabel,
      grams: calculatedNutrients.grams,
      calories: calculatedNutrients.calories,
      protein: calculatedNutrients.protein,
      carbs: calculatedNutrients.carbs,
      fat: calculatedNutrients.fat,
      fiber: calculatedNutrients.fiber,
    });

    closeAddModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E9ECE9]">
        {/* Header (Matches Reference Image 2 Screen 2) */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#F2F4F2]">
          <button
            onClick={() => (selectedFood ? setSelectedFood(null) : closeAddModal())}
            className="w-9 h-9 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#111418] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-sm font-bold text-[#111418]">
            {selectedFood ? 'Food Details' : 'Add Food'}
          </h2>

          <button
            onClick={closeAddModal}
            className="w-9 h-9 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#737A80] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!selectedFood ? (
            /* --- SEARCH VIEW --- */
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C9298] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chicken biryani, dosa, roti, egg, dal..."
                  className="w-full bg-[#F5F7F5] border border-[#EBEFEB] focus:border-[#BCE640] rounded-2xl pl-10 pr-9 py-2.5 text-sm text-[#111418] placeholder:text-[#8C9298] focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9298] hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#111418] text-white'
                        : 'bg-[#F4F6F4] text-[#555C63] hover:bg-[#E8ECE8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C9298] px-1 block mb-2">
                  Database Items ({filteredFoods.length})
                </span>

                {filteredFoods.length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                    {filteredFoods.map((food) => (
                      <div
                        key={food.id}
                        onClick={() => setSelectedFood(food)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAF8] hover:bg-[#F0F5EE] border border-[#EBEFEB] hover:border-[#D0E894] cursor-pointer transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <h3 className="text-xs font-bold text-[#111418] truncate">
                            {food.name}
                          </h3>
                          <p className="text-[11px] text-[#737A80] mt-0.5">
                            P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • F: {food.fat_per_100g}g
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#111418] block">
                            {food.calories_per_100g} kcal
                          </span>
                          <span className="text-[10px] text-[#8C9298]">per 100g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#737A80]">
                    No foods found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          ) : (
            /* --- DETAIL & QUANTITY VIEW (Matches Reference Image 2 Screen 2) --- */
            <div className="space-y-5">
              {/* Food Title & Region */}
              <div className="text-center pt-2">
                <h3 className="text-xl font-black text-[#111418]">
                  {selectedFood.name}
                </h3>
                {selectedFood.region && (
                  <span className="text-xs font-medium text-[#737A80] block mt-0.5">
                    {selectedFood.region} Cuisine • {selectedFood.source}
                  </span>
                )}
              </div>

              {/* 4 Clean Minimalist Macro Stats (Matches Reference Image 2) */}
              <div className="grid grid-cols-4 gap-2 text-center py-2.5 px-3 bg-[#F8FAF8] rounded-2xl border border-[#EAEFEA]">
                <div>
                  <span className="text-sm font-black text-[#111418] block">
                    {calculatedNutrients.calories}
                  </span>
                  <span className="text-[10px] text-[#737A80] font-medium uppercase">Calories</span>
                </div>
                <div>
                  <span className="text-sm font-black text-[#111418] block">
                    {calculatedNutrients.carbs}g
                  </span>
                  <span className="text-[10px] text-[#737A80] font-medium uppercase">Carbs</span>
                </div>
                <div>
                  <span className="text-sm font-black text-[#111418] block">
                    {calculatedNutrients.protein}g
                  </span>
                  <span className="text-[10px] text-[#737A80] font-medium uppercase">Protein</span>
                </div>
                <div>
                  <span className="text-sm font-black text-[#111418] block">
                    {calculatedNutrients.fat}g
                  </span>
                  <span className="text-[10px] text-[#737A80] font-medium uppercase">Fat</span>
                </div>
              </div>

              {/* Meal Slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1.5">
                  Meal
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setMealType(slot)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                        mealType === slot
                          ? 'bg-[#111418] text-white shadow-xs'
                          : 'bg-[#F4F6F4] text-[#555C63] hover:bg-[#E8ECE8]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & Direct Box */}
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(-1)}
                    className="w-11 h-11 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EDE8] text-[#111418] flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1">
                    <input
                      type="number"
                      step={selectedUnitId === 'g' ? '10' : '0.5'}
                      min="0.1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setQuantity(isNaN(val) ? 0 : val);
                      }}
                      className="w-full h-11 bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl text-center font-bold text-lg text-[#111418] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepQuantity(1)}
                    className="w-11 h-11 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EDE8] text-[#111418] flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Serving Unit Dropdown / Options */}
              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1.5">
                  Serving Unit
                </label>
                <div className="space-y-1.5">
                  {selectedFood.servings.map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => {
                        setSelectedUnitId(unit.id);
                        if (unit.id === 'g' && quantity < 10) setQuantity(100);
                        else if (unit.id !== 'g' && quantity > 20) setQuantity(1);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between cursor-pointer transition-all ${
                        selectedUnitId === unit.id
                          ? 'bg-[#F2FAD2] border-[#C8EE44] text-[#111418] font-bold'
                          : 'bg-[#F8FAF8] border-[#EBEFEB] text-[#4B5259] hover:bg-[#F2F5F2]'
                      }`}
                    >
                      <span>{unit.label}</span>
                      {selectedUnitId === unit.id && <Check className="w-4 h-4 text-[#48631C]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lime CTA Button (Matches Reference Image 2) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveToLog}
                  className="w-full py-3.5 px-5 rounded-full bg-[#D4F672] hover:bg-[#C2E84E] text-[#111418] font-black text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <span>Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</span>
                  <span className="text-xs font-semibold opacity-70">({calculatedNutrients.calories} kcal)</span>
                </button>
              </div>

              {/* Nutritional Facts List (Matches Reference Image 2) */}
              <div className="pt-3 border-t border-[#F2F4F2] space-y-2">
                <h4 className="text-xs font-bold text-[#111418]">Nutritional Facts</h4>
                <div className="divide-y divide-[#F2F4F2] text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#737A80]">Calories</span>
                    <span className="font-semibold text-[#111418]">{calculatedNutrients.calories} Cal</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#737A80]">Protein</span>
                    <span className="font-semibold text-[#111418]">{calculatedNutrients.protein} g</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#737A80]">Carbohydrates</span>
                    <span className="font-semibold text-[#111418]">{calculatedNutrients.carbs} g</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#737A80]">Fat</span>
                    <span className="font-semibold text-[#111418]">{calculatedNutrients.fat} g</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#737A80]">Dietary Fiber</span>
                    <span className="font-semibold text-[#111418]">{calculatedNutrients.fiber} g</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
