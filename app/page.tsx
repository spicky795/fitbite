'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';
import { DashboardSummary } from '../components/DashboardSummary';
import { CalendarStrip } from '../components/CalendarStrip';
import { MealSection } from '../components/MealSection';
import { HistoryView } from '../components/HistoryView';
import { BottomNav } from '../components/BottomNav';
import { AddFoodModal } from '../components/AddFoodModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { WeightModal } from '../components/WeightModal';
import { FirebaseConfigModal } from '../components/FirebaseConfigModal';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EBEFEB] sm:py-6 flex justify-center items-start">
      {/* Mobile App Viewport Frame matching reference images */}
      <div className="w-full max-w-md bg-[#F4F6F4] min-h-screen sm:min-h-[920px] sm:rounded-[38px] shadow-2xl border-0 sm:border-8 sm:border-black/5 relative overflow-hidden pb-28 flex flex-col">
        
        {/* iOS Top Status Bar */}
        <div className="pt-2 px-6 pb-1 flex items-center justify-between text-xs font-semibold text-[#111418] select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Top Header Navbar */}
        <Navbar />

        {/* Scrollable Main Content */}
        <main className="flex-1 space-y-4 pt-1">
          {/* 1. Lime Progress Card, Quick Stats & Pastel Macro Cards */}
          <DashboardSummary />

          {/* 2. Calendar Strip with Month & Day Pills */}
          <CalendarStrip />

          {/* 3. Today's Meals with clean cards */}
          <MealSection />

          {/* 4. Weekly Calorie Intake Progress */}
          <HistoryView />

          {/* Traceable Database Disclaimer */}
          <div className="px-6 py-2">
            <p className="text-[11px] text-center text-[#8C939A]">
              ICMR–NIN (IFCT) & USDA FoodData Central • Real-time Cloud Sync
            </p>
          </div>
        </main>

        {/* Floating Bottom Navigation Dock */}
        <BottomNav />

        {/* Modals */}
        <AddFoodModal />
        <OnboardingModal />
        <WeightModal />
        <FirebaseConfigModal />
      </div>
    </div>
  );
}
