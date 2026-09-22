import { NextResponse } from 'next/server';
import { FOOD_DATABASE, FoodItem } from '@/data/foodDatabase';

// Normalizer for USDA FoodData Central API
function normalizeUsdaFood(f: any): FoodItem | null {
  if (!f || !f.description) return null;

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  if (Array.isArray(f.foodNutrients)) {
    for (const n of f.foodNutrients) {
      const name = (n.nutrientName || '').toLowerCase();
      const val = Number(n.value) || 0;

      if (name.includes('energy') && (n.unitName === 'KCAL' || !calories)) {
        calories = Math.round(val);
      } else if (name.includes('protein')) {
        protein = Number(val.toFixed(1));
      } else if (name.includes('carbohydrate')) {
        carbs = Number(val.toFixed(1));
      } else if (name.includes('total lipid') || name.includes('fat')) {
        fat = Number(val.toFixed(1));
      } else if (name.includes('fiber')) {
        fiber = Number(val.toFixed(1));
      }
    }
  }

  // If serving size provided, calculate per 100g
  const servingSize = Number(f.servingSize) || 100;
  if (servingSize > 0 && servingSize !== 100 && calories > 0) {
    const ratio = 100 / servingSize;
    calories = Math.round(calories * ratio);
    protein = Number((protein * ratio).toFixed(1));
    carbs = Number((carbs * ratio).toFixed(1));
    fat = Number((fat * ratio).toFixed(1));
    fiber = Number((fiber * ratio).toFixed(1));
  }

  const cleanName = f.description
    .toLowerCase()
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const defaultServingGram = f.servingSize ? Math.round(f.servingSize) : 100;

  return {
    id: `usda_${f.fdcId}`,
    name: cleanName,
    category: 'Protein',
    region: f.brandOwner || 'Global',
    calories_per_100g: calories,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
    fiber_per_100g: fiber,
    default_serving_unit: 'g',
    servings: [
      { id: 'serving', name: 'serving', label: `1 serving (~${defaultServingGram}g)`, grams: defaultServingGram, isDefault: true },
      { id: 'g', name: 'g', label: 'Grams (g)', grams: 1 },
    ],
    aliases: [f.description.toLowerCase()],
    source: 'USDA',
  };
}

// Normalizer for Open Food Facts API
function normalizeOpenFoodFact(p: any): FoodItem | null {
  if (!p || !p.product_name) return null;

  const n = p.nutriments || {};
  const calories = Math.round(Number(n['energy-kcal_100g'] || n['energy-kcal'] || 0));
  const protein = Number((Number(n.proteins_100g || n.proteins || 0)).toFixed(1));
  const carbs = Number((Number(n.carbohydrates_100g || n.carbohydrates || 0)).toFixed(1));
  const fat = Number((Number(n.fat_100g || n.fat || 0)).toFixed(1));
  const fiber = Number((Number(n.fiber_100g || n.fiber || 0)).toFixed(1));

  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    return null; // Skip empty records
  }

  const brand = p.brands ? ` (${p.brands.split(',')[0].trim()})` : '';
  const fullName = `${p.product_name}${brand}`;

  return {
    id: `off_${p.code || Math.random().toString(36).substring(2, 7)}`,
    name: fullName,
    category: 'Snack & Sweet',
    region: p.brands || 'Packaged Product',
    calories_per_100g: calories,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
    fiber_per_100g: fiber,
    default_serving_unit: 'g',
    servings: [
      { id: 'portion', name: 'serving', label: '1 portion (~100g)', grams: 100, isDefault: true },
      { id: 'g', name: 'g', label: 'Grams (g)', grams: 1 },
    ],
    aliases: [p.product_name.toLowerCase()],
    source: 'Standard Recipe',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query) {
    return NextResponse.json({ results: FOOD_DATABASE.slice(0, 30) });
  }

  const lowerQuery = query.toLowerCase();

  // 1. Search Local Curated Baseline (Instant & Highest Precision for Indian / Regional dishes)
  const localMatches = FOOD_DATABASE.filter((food) => {
    if (food.name.toLowerCase().includes(lowerQuery)) return true;
    if (food.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery))) return true;
    if (food.region?.toLowerCase().includes(lowerQuery)) return true;
    if (food.category.toLowerCase().includes(lowerQuery)) return true;
    return false;
  });

  // 2. Fetch live from USDA FoodData Central & Open Food Facts APIs
  const apiResults: FoodItem[] = [];

  try {
    const [usdaRes, offRes] = await Promise.allSettled([
      fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(
          query
        )}&pageSize=8`,
        { headers: { 'User-Agent': 'FitBiteApp/1.0' }, next: { revalidate: 3600 } }
      ),
      fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          query
        )}&search_simple=1&action=process&json=1&page_size=6`,
        {
          headers: { 'User-Agent': 'FitBiteApp/1.0 (contact@fitbite.local)' },
          next: { revalidate: 3600 },
        }
      ),
    ]);

    // Process USDA
    if (usdaRes.status === 'fulfilled' && usdaRes.value.ok) {
      const usdaData = await usdaRes.value.json();
      if (Array.isArray(usdaData.foods)) {
        for (const item of usdaData.foods) {
          const normalized = normalizeUsdaFood(item);
          if (normalized) apiResults.push(normalized);
        }
      }
    }

    // Process Open Food Facts
    if (offRes.status === 'fulfilled' && offRes.value.ok) {
      const offData = await offRes.value.json();
      if (Array.isArray(offData.products)) {
        for (const p of offData.products) {
          const normalized = normalizeOpenFoodFact(p);
          if (normalized) apiResults.push(normalized);
        }
      }
    }
  } catch (err) {
    console.error('External API search error:', err);
  }

  // 3. Combine with Local matches first, then API results, deduplicating by normalized name
  const seen = new Set<string>();
  const combined: FoodItem[] = [];

  for (const item of [...localMatches, ...apiResults]) {
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return NextResponse.json({ results: combined });
}
