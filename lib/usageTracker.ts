"use client";

import { db, auth, isFirebaseConfigured } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

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

// Read guest credits from LocalStorage (0 Database Reads)
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

// In-memory session cache for logged-in user (Strategy 3: Read Once per session)
let sessionUserCache: UserCredits | null = null;

export async function getUserCredits(): Promise<UserCredits> {
  const currentUser = auth?.currentUser;

  // 1. If not logged in, return LocalStorage guest stats (0 Firebase calls)
  if (!currentUser) {
    const guest = getGuestCredits();
    notifyListeners(guest);
    return guest;
  }

  // 2. Return cached session data if available
  if (sessionUserCache) {
    notifyListeners(sessionUserCache);
    return sessionUserCache;
  }

  // 3. If logged in and Firebase is configured, fetch single user document
  if (db && isFirebaseConfigured) {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      const today = getTodayString();

      if (snap.exists()) {
        const data = snap.data();
        const isPro = Boolean(data.plan === "pro" || data.isProUser);
        const lastDate = data.lastActiveDate || today;
        const usedToday = lastDate === today ? (data.usedToday || 0) : 0;
        const limit = isPro ? 9999 : REGISTERED_DAILY_LIMIT;
        const bonus = data.bonusCredits || 0;
        const remaining = isPro ? 9999 : Math.max(0, limit - usedToday) + bonus;

        sessionUserCache = {
          isLoggedIn: true,
          isPro,
          dailyLimit: limit,
          usedToday,
          remaining,
          bonusCredits: bonus
        };

        notifyListeners(sessionUserCache);
        return sessionUserCache;
      } else {
        // First-time signup creation (1 Write)
        const initial = {
          email: currentUser.email,
          plan: "free",
          isProUser: false,
          usedToday: 0,
          bonusCredits: 0,
          lastActiveDate: today,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initial);

        sessionUserCache = {
          isLoggedIn: true,
          isPro: false,
          dailyLimit: REGISTERED_DAILY_LIMIT,
          usedToday: 0,
          remaining: REGISTERED_DAILY_LIMIT,
          bonusCredits: 0
        };

        notifyListeners(sessionUserCache);
        return sessionUserCache;
      }
    } catch (err) {
      console.warn("[UsageTracker] Error fetching cloud credits, falling back:", err);
    }
  }

  // Fallback if offline
  const fallback = getGuestCredits();
  notifyListeners(fallback);
  return fallback;
}

// Consume credits (Batched / Atomic operation)
export async function consumeCredits(amount: number = 1): Promise<{ success: boolean; remaining: number }> {
  const currentUser = auth?.currentUser;

  // Guest deduction (100% LocalStorage - 0 DB calls)
  if (!currentUser) {
    const current = getGuestCredits();
    if (current.remaining < amount) {
      return { success: false, remaining: current.remaining };
    }

    const today = getTodayString();
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { date: today, used: 0, bonus: 0 };
    
    // First deduct from daily limit, then from bonus
    let remainingToDeduct = amount;
    const dailyAvailable = Math.max(0, GUEST_DAILY_LIMIT - data.used);

    if (dailyAvailable >= remainingToDeduct) {
      data.used += remainingToDeduct;
    } else {
      data.used = GUEST_DAILY_LIMIT;
      remainingToDeduct -= dailyAvailable;
      data.bonus = Math.max(0, (data.bonus || 0) - remainingToDeduct);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const updated = getGuestCredits();
    notifyListeners(updated);
    return { success: true, remaining: updated.remaining };
  }

  // Logged-in user atomic update (Strategy 4: Single write)
  if (db && isFirebaseConfigured) {
    try {
      const state = await getUserCredits();
      if (!state.isPro && state.remaining < amount) {
        return { success: false, remaining: state.remaining };
      }

      if (!state.isPro) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          usedToday: increment(amount),
          totalProcessed: increment(amount),
          lastActiveDate: getTodayString()
        });
      }

      if (sessionUserCache) {
        sessionUserCache.usedToday += amount;
        sessionUserCache.remaining = Math.max(0, sessionUserCache.remaining - amount);
        notifyListeners(sessionUserCache);
      }

      return { success: true, remaining: sessionUserCache?.remaining || 0 };
    } catch (e) {
      console.warn("[UsageTracker] Error updating cloud credits:", e);
    }
  }

  return { success: true, remaining: 10 };
}

// Rewarded Ad or Social Share bonus credits
export async function addBonusCredits(amount: number = 5): Promise<number> {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const today = getTodayString();
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { date: today, used: 0, bonus: 0 };
    data.bonus = (data.bonus || 0) + amount;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const updated = getGuestCredits();
    notifyListeners(updated);
    return updated.remaining;
  }

  if (db && isFirebaseConfigured) {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        bonusCredits: increment(amount)
      });
      if (sessionUserCache) {
        sessionUserCache.bonusCredits += amount;
        sessionUserCache.remaining += amount;
        notifyListeners(sessionUserCache);
      }
      return sessionUserCache?.remaining || 0;
    } catch (e) {
      console.warn("Failed to add cloud bonus credits:", e);
    }
  }

  return 10;
}

// Event subscription for dynamic UI badge updates
export function subscribeToCredits(callback: CreditListener): () => void {
  listeners.add(callback);
  // Send initial state immediately
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
