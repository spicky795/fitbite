'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  getActiveFirebaseConfig,
  isFirebaseConnected,
  FirebaseConfig,
} from '../lib/firebase';
import { X, Cloud, Check, Smartphone, Globe, Copy, AlertCircle, ExternalLink } from 'lucide-react';

export const FirebaseConfigModal: React.FC = () => {
  const {
    isCloudModalOpen,
    setIsCloudModalOpen,
    userId,
    setUserId,
  } = useApp();

  const currentConfig = getActiveFirebaseConfig();
  const [configJson, setConfigJson] = useState<string>(
    currentConfig ? JSON.stringify(currentConfig, null, 2) : ''
  );
  const [inputUserId, setInputUserId] = useState<string>(userId);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isCloudModalOpen) return null;

  const handleSaveConfig = () => {
    try {
      // Allow pasting raw JS object or JSON
      let cleaned = configJson.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim();
      }
      // If keys are not quoted, convert common JS object to JSON
      if (!cleaned.startsWith('{')) {
        throw new Error('Please paste a valid JSON or firebaseConfig object');
      }

      // Try parsing JSON or evaluating object safely
      let parsed: FirebaseConfig;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Simple regex extractor for common firebaseConfig snippet
        const extract = (key: string) => {
          const match = cleaned.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
          return match ? match[1] : '';
        };
        parsed = {
          apiKey: extract('apiKey'),
          authDomain: extract('authDomain'),
          projectId: extract('projectId'),
          storageBucket: extract('storageBucket'),
          messagingSenderId: extract('messagingSenderId'),
          appId: extract('appId'),
        };
      }

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Missing apiKey or projectId in the configuration');
      }

      saveCustomFirebaseConfig(parsed);
      setUserId(inputUserId.trim() || 'my_account');
      setStatusMessage('Connected successfully! Real-time Cloud Sync is now active.');
      setTimeout(() => {
        setIsCloudModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Invalid configuration'}`);
    }
  };

  const handleDisconnect = () => {
    clearCustomFirebaseConfig();
    setStatusMessage('Firebase disconnected. Now using Local Storage.');
    setTimeout(() => {
      setStatusMessage('');
    }, 1500);
  };

  const isConnected = isFirebaseConnected();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E9ECE9]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2F4F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5F3FC] flex items-center justify-center text-[#0D62A5]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111418]">Cross-Device Cloud Sync</h2>
              <p className="text-[11px] text-[#737A80]">
                {isConnected ? 'Connected to Firebase' : 'Sync phone, tablet & laptop'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4F6F4] hover:bg-[#E8ECE8] flex items-center justify-center text-[#737A80] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#353A40]">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-between ${
              isConnected
                ? 'bg-[#F1F9D4] border border-[#DCEFB0] text-[#2F4F0C]'
                : 'bg-[#F8FAF8] border border-[#EAEFEA] text-[#555C63]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-[#5B8814] animate-pulse' : 'bg-[#9CA3AF]'
                }`}
              />
              <span className="font-bold">
                {isConnected ? 'Cloud Sync Active (Firestore)' : 'Offline / Local Storage Mode'}
              </span>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] text-[#9E2A2B] hover:underline font-semibold"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Sync User ID */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#737A80]">
              Your Mobile Sync ID (Username)
            </label>
            <input
              type="text"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              placeholder="e.g. srinu_fitness"
              className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl px-3 py-2 text-xs font-bold text-[#111418] focus:outline-none"
            />
            <p className="text-[10px] text-[#737A80]">
              Enter this same ID when you open the app on your mobile phone to access all your logged meals automatically.
            </p>
          </div>

          {/* Step-by-step Setup instructions */}
          <div className="p-3.5 bg-[#F9FAF9] rounded-2xl border border-[#EAEFEA] space-y-2">
            <h3 className="font-bold text-[#111418] flex items-center justify-between">
              <span>3-Minute Firebase Setup (100% Free)</span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#0D62A5] flex items-center gap-0.5 hover:underline"
              >
                <span>Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-[#555C63] leading-relaxed">
              <li>Open <strong>console.firebase.google.com</strong> and click <strong>Create a project</strong>.</li>
              <li>Go to <strong>Build → Firestore Database</strong> and click <strong>Create Database</strong> (start in Test mode).</li>
              <li>Click <strong>Project Settings (Gear icon) → Add Web App `&lt;/&gt;`</strong>.</li>
              <li>Copy the <code>firebaseConfig</code> code snippet and paste it below!</li>
            </ol>
          </div>

          {/* Firebase Config JSON Textarea */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#737A80]">
              Paste Firebase Config
            </label>
            <textarea
              rows={5}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-app.firebaseapp.com",\n  "projectId": "my-app",\n  "appId": "1:..."\n}`}
              className="w-full bg-[#F8FAF8] border border-[#E0E5E0] focus:border-[#BCE640] rounded-xl p-2.5 font-mono text-[11px] text-[#111418] focus:outline-none"
            />
          </div>

          {statusMessage && (
            <p
              className={`text-xs font-semibold p-2 rounded-xl text-center ${
                statusMessage.includes('Error')
                  ? 'bg-[#FDF2F2] text-[#991B1B]'
                  : 'bg-[#F2FAD2] text-[#3D5A12]'
              }`}
            >
              {statusMessage}
            </p>
          )}

          {/* Connect Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="w-full py-3 px-4 rounded-full bg-[#D4F672] hover:bg-[#C2E84E] text-[#111418] font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Connect & Enable Live Sync</span>
            </button>
          </div>

          {/* Mobile Deployment Tips */}
          <div className="pt-2 border-t border-[#F2F4F2] space-y-1.5 text-[11px] text-[#737A80]">
            <span className="font-bold text-[#111418] block">How to open on your phone:</span>
            <p>
              1. <strong>Local Network</strong>: Open <code>http://YOUR_PC_IP:3000</code> in mobile Safari / Chrome (make sure both are on same Wi-Fi).
            </p>
            <p>
              2. <strong>One-Click Vercel Deploy</strong>: Push to GitHub & deploy on Vercel for free HTTPS URL, then tap <strong>"Add to Home Screen"</strong> on your phone for a full native app experience!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
