"use client";

import { account, databases, APPWRITE_CONFIG } from "./appwrite";

export interface UserCredits {
  isLoggedIn: boolean;
  isPro: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  bonusCredits: number;
}

const GUEST_DAILY_LIMIT = 5;
const REGISTERED_DAILY_LIMIT = 25;
const STORAGE_KEY = "polishai_guest_credits_v1";

type CreditListener = (state: UserCredits) => void;
const listeners: Set<CreditListener> = new Set();

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// 1. Guest Credits via LocalStorage (0 Server / Database calls)
export function getGuestCredits(): UserCredits {
  if (typeof window === "undefined") {
    return {
      isLoggedIn: false,
      isPro: false,
      dailyLimit: GUEST_DAILY_LIMIT,
      usedToday: 0,
      remaining: GUEST_DAILY_LIMIT,
      bonusCredits: 0
    };
  }

  const today = getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;

    if (!data || data.date !== today) {
      const fresh = { date: today, used: 0, bonus: data?.bonus || 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return {
        isLoggedIn: false,
        isPro: false,
        dailyLimit: GUEST_DAILY_LIMIT,
        usedToday: 0,
        remaining: GUEST_DAILY_LIMIT + (fresh.bonus || 0),
        bonusCredits: fresh.bonus || 0
      };
    }

    const totalRemaining = Math.max(0, GUEST_DAILY_LIMIT - data.used) + (data.bonus || 0);
    return {
      isLoggedIn: false,
      isPro: false,
      dailyLimit: GUEST_DAILY_LIMIT,
      usedToday: data.used,
      remaining: totalRemaining,
      bonusCredits: data.bonus || 0
    };
  } catch (e) {
    return {
      isLoggedIn: false,
      isPro: false,
      dailyLimit: GUEST_DAILY_LIMIT,
      usedToday: 0,
      remaining: GUEST_DAILY_LIMIT,
      bonusCredits: 0
    };
  }
}

// In-memory session cache for active user
let sessionUserCache: UserCredits | null = null;
let cachedAccountUser: any = null;

// Check Appwrite current session
async function getAppwriteUser() {
  if (cachedAccountUser) return cachedAccountUser;
  try {
    if (typeof window !== "undefined" && account) {
      cachedAccountUser = await account.get();
      return cachedAccountUser;
    }
  } catch {
    cachedAccountUser = null;
  }
  return null;
}

export async function getUserCredits(): Promise<UserCredits> {
  // 1. Check if user is logged into Appwrite
  const appwriteUser = await getAppwriteUser();

  if (!appwriteUser) {
    const guest = getGuestCredits();
    notifyListeners(guest);
    return guest;
  }

  // 2. Return cached session data if available
  if (sessionUserCache) {
    notifyListeners(sessionUserCache);
    return sessionUserCache;
  }

  // 3. Registered Appwrite user gets 25 free daily credits
  const isPro = Boolean(appwriteUser.labels?.includes("pro") || appwriteUser.prefs?.isPro);
  const guestState = getGuestCredits();

  sessionUserCache = {
    isLoggedIn: true,
    isPro,
    dailyLimit: isPro ? 9999 : REGISTERED_DAILY_LIMIT,
    usedToday: guestState.usedToday,
    remaining: isPro ? 9999 : Math.max(0, REGISTERED_DAILY_LIMIT - guestState.usedToday) + guestState.bonusCredits,
    bonusCredits: guestState.bonusCredits
  };

  notifyListeners(sessionUserCache);
  return sessionUserCache;
}

// Unlimited Free Usage (No quota restrictions imposed on users)
export async function consumeCredits(amount: number = 1): Promise<{ success: boolean; remaining: number }> {
  return { success: true, remaining: 999999 };
}

// Rewarded Ad or bonus credits
export async function addBonusCredits(amount: number = 5): Promise<number> {
  const today = getTodayString();
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : { date: today, used: 0, bonus: 0 };
  data.bonus = (data.bonus || 0) + amount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  if (sessionUserCache) {
    sessionUserCache.bonusCredits += amount;
    sessionUserCache.remaining += amount;
    notifyListeners(sessionUserCache);
    return sessionUserCache.remaining;
  }

  const updated = getGuestCredits();
  notifyListeners(updated);
  return updated.remaining;
}

// Event subscription for live UI badge updates
export function subscribeToCredits(callback: CreditListener): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    getUserCredits().then(callback);
  }
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(state: UserCredits) {
  listeners.forEach(cb => {
    try {
      cb(state);
    } catch (e) {
      console.error("Credit listener error:", e);
    }
  });
}
