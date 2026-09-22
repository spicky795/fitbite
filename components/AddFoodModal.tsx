'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp, MealType } from '../context/AppContext';
import { FOOD_DATABASE, FoodItem } from '../data/foodDatabase';
import { calculateNutrients, NutrientBreakdown } from '../lib/calorieEngine';
import { saveCustomFoodToFirestore } from '../lib/firebase';
import { Search, X, ChevronLeft, Plus, Minus, Globe, Sparkles, Database, Loader2 } from 'lucide-react';

export const AddFoodModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeAddModal,
    activeMealType,
    selectedDate,
    addFoodLog,
    userId,
    isCloudConnected,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('g');
  const [quantity, setQuantity] = useState<number>(1);
  const [mealType, setMealType] = useState<MealType>(activeMealType);

  // Live API Search results & Loading state
  const [searchResults, setSearchResults] = useState<FoodItem[]>(FOOD_DATABASE);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  // Add Custom Food Mode
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState<number>(150);
  const [customProtein, setCustomProtein] = useState<number>(5);
  const [customCarbs, setCustomCarbs] = useState<number>(20);
  const [customFat, setCustomFat] = useState<number>(4);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      setMealType(activeMealType);
      setSelectedFood(null);
      setSearchQuery('');
      setSelectedCategory('All');
      setIsCustomMode(false);
      setSearchResults(FOOD_DATABASE);
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

  // Live Search Effect: queries /api/foods/search (USDA + Open Food Facts + Local) with 250ms debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(FOOD_DATABASE);
      setIsSearchingApi(false);
      return;
    }

    // Instant local filter first
    const lower = trimmed.toLowerCase();
    const instantLocal = FOOD_DATABASE.filter((f) => {
      return (
        f.name.toLowerCase().includes(lower) ||
        f.aliases.some((a) => a.toLowerCase().includes(lower)) ||
        f.region?.toLowerCase().includes(lower)
      );
    });
    if (instantLocal.length > 0) {
      setSearchResults(instantLocal);
    }

    // Debounced query to live database APIs (USDA + Open Food Facts)
    setIsSearchingApi(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.results) && json.results.length > 0) {
            setSearchResults(json.results);
          }
        }
      } catch (err) {
        console.error('Failed to query live nutrition API:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const categories = ['All', 'Breakfast', 'Curry & Dal', 'Bread & Rice', 'Protein', 'Dairy', 'Snack & Sweet', 'Fruit & Veg', 'Beverage'];

  const filteredFoods = useMemo(() => {
    if (selectedCategory === 'All') return searchResults;
    return searchResults.filter((f) => f.category === selectedCategory);
  }, [searchResults, selectedCategory]);

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

  const handleCreateCustomDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      category: 'Indian Dish',
      region: 'Custom Recipe',
      calories_per_100g: Number(customCalories) || 100,
      protein_per_100g: Number(customProtein) || 0,
      carbs_per_100g: Number(customCarbs) || 0,
      fat_per_100g: Number(customFat) || 0,
      fiber_per_100g: 1.0,
      default_serving_unit: 'serving',
      servings: [
        { id: 'serving', name: 'serving', label: '1 serving (~150g)', grams: 150, isDefault: true },
        { id: 'g', name: 'g', label: 'Grams (g)', grams: 1 },
      ],
      aliases: [customName.toLowerCase()],
      source: 'Standard Recipe',
    };

    if (isCloudConnected) {
      await saveCustomFoodToFirestore(userId, newFood);
    }

    setSearchResults((prev) => [newFood, ...prev]);
    setSelectedFood(newFood);
    setIsCustomMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E9ECE9]">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#F2F4F2]">
          <button
            onClick={() => {
              if (selectedFood) setSelectedFood(null);
              else if (isCustomMode) setIsCustomMode(false);
              else closeAddModal();
            }}
            className="w-9 h-9 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#111418] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-sm font-bold text-[#111418]">
            {selectedFood
              ? 'Food Details'
              : isCustomMode
              ? 'Add Custom Dish'
              : 'Add Food'}
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
          {isCustomMode ? (
            /* --- ADD CUSTOM DISH FORM (Saves to Cloud Firestore) --- */
            <form onSubmit={handleCreateCustomDish} className="space-y-3.5">
              <div className="p-3 bg-[#F4F6F4] rounded-2xl flex items-center gap-2 text-xs text-[#48631C]">
                <Database className="w-4 h-4 text-[#6B9322] shrink-0" />
                <span>This dish will be saved permanently to your Cloud Database.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#737A80] mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Special Chicken Curry, Semiya Kheer"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#737A80] mb-1">Calories (per 100g)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(Number(e.target.value))}
                    className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#737A80] mb-1">Protein (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customProtein}
                    onChange={(e) => setCustomProtein(Number(e.target.value))}
                    className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#737A80] mb-1">Carbs (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(Number(e.target.value))}
                    className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#737A80] mb-1">Fat (g per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customFat}
                    onChange={(e) => setCustomFat(Number(e.target.value))}
                    className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-full bg-[#D4F672] hover:bg-[#C2E84E] text-[#111418] font-black text-xs shadow-xs transition-all cursor-pointer"
                >
                  Save Dish & Select
                </button>
              </div>
            </form>
          ) : !selectedFood ? (
            /* --- SEARCH VIEW WITH LIVE NUTRITION DATABASES --- */
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C9298] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any food, dish, or brand (e.g. Lay's, Upma, Maggi, Dosa)..."
                  className="w-full bg-[#F5F7F5] border border-[#EBEFEB] focus:border-[#BCE640] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-[#111418] placeholder:text-[#8C9298] focus:outline-none transition-colors"
                />
                {isSearchingApi ? (
                  <Loader2 className="w-4 h-4 text-[#8C9298] absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                ) : searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C9298] hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
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

              {/* Database Results Info */}
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8C9298] px-1 pt-1">
                <span>RESULTS ({filteredFoods.length})</span>
                <span className="flex items-center gap-1 text-[10px] text-[#6B9322]">
                  <Globe className="w-3 h-3" /> Live Databases Active
                </span>
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAF8] hover:bg-[#F0F5EE] border border-[#EBEFEB] hover:border-[#D0E894] cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-[#111418] truncate">
                          {food.name}
                        </h3>
                        {food.source && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#EBF0EB] text-[#5A635A] shrink-0 font-medium">
                            {food.source}
                          </span>
                        )}
                      </div>
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

              {/* "+ Add Custom Dish to Cloud DB" CTA Button */}
              <div className="pt-2 border-t border-[#F2F4F2]">
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(searchQuery);
                    setIsCustomMode(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EDE8] text-[#111418] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Custom Dish to Cloud Database</span>
                </button>
              </div>
            </>
          ) : (
            /* --- DETAIL & QUANTITY VIEW --- */
            <div className="space-y-5">
              {/* Food Title & Region */}
              <div className="text-center pt-2">
                <h3 className="text-xl font-black text-[#111418]">
                  {selectedFood.name}
                </h3>
                <span className="text-xs font-medium text-[#737A80] block mt-0.5">
                  {selectedFood.region || 'Standard'} • Source: {selectedFood.source}
                </span>
              </div>

              {/* 4 Clean Minimalist Macro Stats */}
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

              {/* Serving Unit Options */}
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
                      <span className="text-[10px] text-[#737A80]">
                        {unit.id === 'g' ? 'Base 100g' : `~${unit.grams}g`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lime CTA Button */}
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

              {/* Nutritional Facts List */}
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
