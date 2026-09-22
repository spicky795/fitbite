'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserProfile, calculateDailyTargets } from '../lib/calorieEngine';
import {
  initFirebase,
  isFirebaseConnected,
  syncLogToFirestore,
  deleteLogFromFirestore,
  syncProfileToFirestore,
  syncWeightToFirestore,
  subscribeToUserData,
} from '../lib/firebase';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId: string;
  foodName: string;
  emoji?: string;
  quantity: number;
  unitId: string;
  unitLabel: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: number;
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  mealCalories: Record<MealType, number>;
}

interface AppContextType {
  profile: UserProfile;
  updateProfile: (newProfile: UserProfile) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  logs: FoodLogItem[];
  addFoodLog: (item: Omit<FoodLogItem, 'id' | 'timestamp'>) => void;
  deleteFoodLog: (id: string) => void;
  weightHistory: WeightEntry[];
  logWeight: (weightKg: number, date?: string) => void;
  getDailySummary: (date: string) => DailySummary;
  isAddModalOpen: boolean;
  openAddModal: (mealType?: MealType) => void;
  closeAddModal: () => void;
  activeMealType: MealType;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isWeightModalOpen: boolean;
  setIsWeightModalOpen: (open: boolean) => void;
  isCloudModalOpen: boolean;
  setIsCloudModalOpen: (open: boolean) => void;
  userId: string;
  setUserId: (id: string) => void;
  isCloudConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Srinivas',
  age: 26,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderate',
  goal: 'lose',
  targetWeightKg: 70,
  dailyCalorieTarget: 2300,
  dailyProteinTarget: 150,
  dailyCarbTarget: 260,
  dailyFatTarget: 70,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  // Start with clean slate (no fake food entries)
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([
    { date: getTodayDateString(), weightKg: 75.0 },
  ]);

  const [userId, setUserIdState] = useState<string>('my_profile');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage first
  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem('fitbite_user_id') || 'my_profile';
      setUserIdState(savedUserId);

      const savedProfile = localStorage.getItem('fitbite_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        const targets = calculateDailyTargets(
          DEFAULT_PROFILE.weightKg,
          DEFAULT_PROFILE.heightCm,
          DEFAULT_PROFILE.age,
          DEFAULT_PROFILE.sex,
          DEFAULT_PROFILE.activityLevel,
          DEFAULT_PROFILE.goal
        );
        setProfile({
          ...DEFAULT_PROFILE,
          dailyCalorieTarget: targets.targetCalories,
          dailyProteinTarget: targets.proteinGrams,
          dailyCarbTarget: targets.carbsGrams,
          dailyFatTarget: targets.fatGrams,
        });
      }

      const savedLogs = localStorage.getItem('fitbite_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }

      const savedWeights = localStorage.getItem('fitbite_weights');
      if (savedWeights) {
        setWeightHistory(JSON.parse(savedWeights));
      }

      setIsCloudConnected(isFirebaseConnected());
    } catch (e) {
      console.error('Failed to parse local storage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Firebase Real-time Firestore sync
  useEffect(() => {
    if (!isInitialized) return;

    initFirebase();
    const connected = isFirebaseConnected();
    setIsCloudConnected(connected);

    if (connected && userId) {
      const unsubscribe = subscribeToUserData(userId, {
        onLogsUpdate: (cloudLogs) => {
          setLogs(cloudLogs);
          localStorage.setItem('fitbite_logs', JSON.stringify(cloudLogs));
        },
        onProfileUpdate: (cloudProfile) => {
          setProfile(cloudProfile);
          localStorage.setItem('fitbite_profile', JSON.stringify(cloudProfile));
        },
        onWeightsUpdate: (cloudWeights) => {
          setWeightHistory(cloudWeights);
          localStorage.setItem('fitbite_weights', JSON.stringify(cloudWeights));
        },
      });

      return () => unsubscribe();
    }
  }, [userId, isInitialized]);

  // Save to LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('fitbite_profile', JSON.stringify(profile));
  }, [profile, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('fitbite_logs', JSON.stringify(logs));
  }, [logs, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('fitbite_weights', JSON.stringify(weightHistory));
  }, [weightHistory, isInitialized]);

  const setUserId = (newId: string) => {
    setUserIdState(newId);
    localStorage.setItem('fitbite_user_id', newId);
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (isCloudConnected) {
      syncProfileToFirestore(userId, newProfile);
    }
  };

  const addFoodLog = (item: Omit<FoodLogItem, 'id' | 'timestamp'>) => {
    const newItem: FoodLogItem = {
      ...item,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };
    setLogs((prev) => [newItem, ...prev]);

    if (isFirebaseConnected()) {
      syncLogToFirestore(userId, newItem);
    }
  };

  const deleteFoodLog = (id: string) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConnected()) {
      deleteLogFromFirestore(userId, id);
    }
  };

  const logWeight = (weightKg: number, date: string = selectedDate) => {
    const entry: WeightEntry = { date, weightKg };
    setWeightHistory((prev) => {
      const filtered = prev.filter((w) => w.date !== date);
      return [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
    setProfile((prev) => ({ ...prev, weightKg }));

    if (isFirebaseConnected()) {
      syncWeightToFirestore(userId, entry);
      syncProfileToFirestore(userId, { ...profile, weightKg });
    }
  };

  const getDailySummary = (date: string): DailySummary => {
    const dayLogs = logs.filter((log) => log.date === date);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const mealCalories: Record<MealType, number> = {
      breakfast: 0,
      lunch: 0,
      snack: 0,
      dinner: 0,
    };

    dayLogs.forEach((item) => {
      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;
      totalFiber += item.fiber;
      if (mealCalories[item.mealType] !== undefined) {
        mealCalories[item.mealType] += item.calories;
      }
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Number(totalProtein.toFixed(1)),
      totalCarbs: Number(totalCarbs.toFixed(1)),
      totalFat: Number(totalFat.toFixed(1)),
      totalFiber: Number(totalFiber.toFixed(1)),
      mealCalories,
    };
  };

  const openAddModal = (mealType: MealType = 'breakfast') => {
    setActiveMealType(mealType);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        selectedDate,
        setSelectedDate,
        logs,
        addFoodLog,
        deleteFoodLog,
        weightHistory,
        logWeight,
        getDailySummary,
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        activeMealType,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isWeightModalOpen,
        setIsWeightModalOpen,
        isCloudModalOpen,
        setIsCloudModalOpen,
        userId,
        setUserId,
        isCloudConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
