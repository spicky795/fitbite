import { FoodItem } from '../data/foodDatabase';

export interface NutrientBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FitnessGoal = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  targetWeightKg?: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
}

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string; multiplier: number }> = {
  sedentary: { label: 'Sedentary', desc: 'Little or no exercise, desk work', multiplier: 1.2 },
  light: { label: 'Lightly Active', desc: 'Light exercise / walks 1-3 days/wk', multiplier: 1.375 },
  moderate: { label: 'Moderately Active', desc: 'Moderate workout/gym 3-5 days/wk', multiplier: 1.55 },
  active: { label: 'Very Active', desc: 'Hard training / sports 6-7 days/wk', multiplier: 1.725 },
  very_active: { label: 'Extremely Active', desc: 'Athletic training & physical job', multiplier: 1.9 },
};

/**
 * Calculates deterministic nutrients for a given food, quantity, and unit.
 */
export function calculateNutrients(food: FoodItem, quantity: number, unitId: string): NutrientBreakdown {
  if (quantity <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 };
  }

  let equivalentGrams = quantity;
  if (unitId !== 'g') {
    const serving = food.servings.find((s) => s.id === unitId);
    if (serving) {
      equivalentGrams = quantity * serving.grams;
    }
  }

  const ratio = equivalentGrams / 100;

  return {
    calories: Math.round(food.calories_per_100g * ratio),
    protein: Number((food.protein_per_100g * ratio).toFixed(1)),
    carbs: Number((food.carbs_per_100g * ratio).toFixed(1)),
    fat: Number((food.fat_per_100g * ratio).toFixed(1)),
    fiber: Number((food.fiber_per_100g * ratio).toFixed(1)),
    grams: Math.round(equivalentGrams),
  };
}

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  if (sex === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_LABELS[activityLevel]?.multiplier || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates recommended daily calories and macro targets (Protein, Carbs, Fat).
 */
export function calculateDailyTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
  goal: FitnessGoal
) {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activityLevel);

  let targetCalories = tdee;
  if (goal === 'lose') {
    // 500 kcal deficit (~0.5 kg loss per week)
    targetCalories = Math.max(sex === 'female' ? 1200 : 1500, tdee - 500);
  } else if (goal === 'gain') {
    // 350 kcal surplus (~0.35 kg lean gain per week)
    targetCalories = tdee + 350;
  }

  // Protein target: 1.8g - 2.0g per kg of bodyweight (ideal for muscle retention/growth)
  const proteinGrams = Math.round(weightKg * (goal === 'lose' ? 2.0 : 1.8));
  const proteinKcal = proteinGrams * 4;

  // Fat target: ~25% of total calories (1g fat = 9 kcal)
  const fatKcal = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatKcal / 9);

  // Carbs target: remaining calories (1g carb = 4 kcal)
  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const carbsGrams = Math.round(remainingKcal / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
  };
}
