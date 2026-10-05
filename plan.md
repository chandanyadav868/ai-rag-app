# PolishAI — Commercial Monetization, Zero-Server-Cost Architecture & Ad Strategy

## Executive Summary & Product Vision

Turning **PolishAI** from a free side project into a profitable, sustainable commercial product requires solving two fundamental equations:
1. **The Cost Equation:** Driving server infrastructure and AI execution costs to near **$0.00**, so that every single visitor is net-profitable.
2. **The Revenue Equation:** Generating predictable revenue through **non-intrusive, high-RPM ads, rewarded micro-actions, freemium subscriptions, and affiliate pipelines** without alienating users or ruining the creative canvas workflow.

Because PolishAI executes cutting-edge neural models (**RMBG-1.4**, **CLIPSeg**, and Canvas pipelines) **directly inside the client's browser using WebGPU & WebAssembly**, you have an immense competitive advantage over traditional cloud AI apps (like Photoroom, Remove.bg, or Canva) that pay $0.01 – $0.03 in GPU server costs for *every single image*.

---

## 1. Zero-Cost Infrastructure Architecture: How to Eliminate Server Costs

Most AI startups fail because they pay cloud GPU bills (Nvidia A10G / A100 at $1.00 – $3.50/hour) for free users. PolishAI is built fundamentally differently:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        POLISHAI CLIENT BROWSER                         │
│  • RMBG-1.4 Matting (WebGPU / WASM)  →  Client GPU/CPU ($0.00)         │
│  • CLIPSeg Object Isolation          →  Client GPU/CPU ($0.00)         │
│  • Canvas Filtering & Compositing    →  HTML5 Canvas  ($0.00)         │
│  • GIF Encoding & Frames Parsing     →  Web Worker     ($0.00)         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Only static bundles & assets
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      GLOBAL EDGE / STATIC HOSTING                      │
│  • Hosting: Cloudflare Pages / Vercel Hobby Tier   →  $0.00/mo         │
│  • Edge CDN & Caching (Unlimited Bandwidth)        →  $0.00/mo         │
│  • Model Weights (Cached on HuggingFace Hub CDN)   →  $0.00/mo         │
│  • Client Persistent Model Cache (Cache API)       →  $0.00/mo         │
└────────────────────────────────────────────────────────────────────────┘
```

### The $0/Month Infrastructure Blueprint (Up to 250,000 Monthly Active Users)
| Resource | Traditional AI SaaS | PolishAI Architecture | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **GPU Inference** | AWS / RunPod GPU servers | **Client-side WebGPU/WASM** | **$0.00** |
| **Model Weights Delivery** | Dedicated S3 bucket egress ($0.09/GB) | **Hugging Face Hub CDN + Browser Cache API** | **$0.00** |
| **Web Hosting & SSL** | Dedicated VPS / Cloud Kubernetes | **Vercel Hobby / Cloudflare Pages Free** | **$0.00** |
| **Bandwidth & DDOS** | Cloudflare Pro ($20/mo) | **Cloudflare Free Tier (Unlimited bandwidth)**| **$0.00** |
| **Image Storage** | AWS S3 / Cloudinary | **Zero storage** (Images never leave client device) | **$0.00** |
| **Total Baseline Cost** | **$450 – $2,500/month** | **PolishAI Client-First Stack** | **$0.00/month** |

> [!TIP]
> **Privacy as a Marketing & Cost-Saving Superpower:**
> Because images are processed locally in the user's browser, you never need cloud storage (S3) or server GPUs. You can market this as *"100% Private — Your confidential photos never touch a server"*, which wins enterprise and privacy-conscious users while saving you thousands in infrastructure!

---

## 2. Where & How to Show Ads Without Frustrating Users

The biggest mistake creative websites make is placing flashy popups, disruptive interstitials, or sticky banners that block drawing tools, split-sliders, and menus. 

In an image editing tool, **the Canvas is sacred**. The user must feel that the tool is professional, responsive, and respectful.

### The 5 High-Conversion, Non-Intrusive Ad Placements

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  POLISHAI HEADER                                                             [PRO Upgrade]│
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────────────────────┐  │
│  │ LEFT CONTROLS         │  │ MAIN WORKSPACE STAGE                                    │  │
│  │ • Backdrop Studio     │  │                                                         │  │
│  │ • Shadows             │  │   [ SPLIT SLIDER / CANVAS VIEWPORT ]                    │  │
│  │ • Selective Mode      │  │                                                         │  │
│  │                       │  │   (Never place ads inside or covering the canvas!)      │  │
│  │ ───────────────────── │  │                                                         │  │
│  │ [PLACEMENT 3:         │  └─────────────────────────────────────────────────────────┘  │
│  │  Sidebar Display Unit │  ┌─────────────────────────────────────────────────────────┐  │
│  │  300x250 Medium Rect] │  │ [PLACEMENT 1: Processing Progress Sponsored Card]       │  │
│  └───────────────────────┘  └─────────────────────────────────────────────────────────┘  │
│                             ┌─────────────────────────────────────────────────────────┐  │
│                             │ [PLACEMENT 2: Post-Download / Export Success Modal Ad]  │  │
│                             └─────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  [PLACEMENT 5: Bottom Docked Sticky Leaderboard 728x90 (Desktop) / 320x50 (Mobile)]     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Placement 1: The "Processing State" Micro-Ad Card (Highest Attention & Engagement)
* **Where:** Inside the progress container during RMBG-1.4 inference or GIF compilation (which takes 1.5 to 3.5 seconds).
* **Why it works:** When users click *"Remove Background"*, their eyes are fixed on the screen waiting for the result. Showing a clean, native 300x100 sponsor card or text sponsorship here captures 100% focused attention.
* **UX Safety:** The moment processing finishes, the ad cleanly dissolves into the completed result. It **never delays** the user.

### Placement 2: The "Post-Download / Export Success" Modal
* **Where:** After the user clicks *"Download PNG"* or *"Download ZIP"*.
* **How it displays:**
  - A clean modal appears: *"Your HD Cutout is downloaded!"*
  - Below the checkmark: A 300×250 medium rectangle ad or a promoted affiliate tool (e.g. Canva Pro, Shopify 1-Dollar Trial, or AI Upscaler).
  - Also displays two high-utility action buttons: *"Copy Image"*, *"Edit in Canvas Studio"*, or *"Close"*.
* **Why it works:** The user has already received the core value for free. Their friction threshold is virtually zero because their file is already safely on their computer!

### Placement 3: The Left Sidebar Tool Panel Footer (Desktop)
* **Where:** At the very bottom of the Left Controls panel (below *Backdrop Studio* and *Export Actions*).
* **Format:** Standard IAB 300×250 Medium Rectangle (Desktop only, hidden on mobile).
* **UX Safety:** Placed below all primary controls so it never interferes with picking colors, adjusting shadow density, or uploading files.

### Placement 4: The Empty State / Upload Dropzone Banner
* **Where:** On `/image-bg-removal` and `/image-editing` before the user uploads an image, right below the Sample Images carousel.
* **Format:** 728×90 Leaderboard or responsive display banner.
* **UX Safety:** Disappears or pushes down once an image is loaded, returning 100% of the screen real-estate to the active editing workspace.

### Placement 5: Mobile Docked Bottom Banner (320×50 Mobile Anchor)
* **Where:** Fixed to the very bottom of the mobile screen with an easy minimize button (`[x] Hide Ad`).
* **Format:** Google AdSense Mobile Anchor banner (320×50 or responsive smart banner).
* **UX Safety:** Configured with `safe-area-inset-bottom` so it never overlaps the mobile action buttons or navigation bar.

---

## 3. All Revenue Sources: How to Monetize PolishAI

Don't rely solely on basic banner ads (which pay $1.50 – $3.50 RPM). Build a **hybrid monetization engine**:

```
                       ┌──────────────────────────────┐
                       │  POLISHAI MONETIZATION MIX   │
                       └──────────────┬───────────────┘
                                      │
         ┌──────────────────┬─────────┴────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐
│ DISPLAY &       ││ REWARDED ADS    ││ PRO FREEMIUM    ││ HIGH-TICKET     │
│ CONTEXTUAL ADS  ││ & SPONSORSHIPS  ││ SUBSCRIPTIONS   ││ AFFILIATE LINKS │
│ (AdSense/Carbon)││ (Unlock 4K/Batch││ ($4.99/mo Stripe││ (Shopify/Canva/ │
│ $2 - $6 RPM     ││ $15 - $30 CPM   ││ 1-3% Conversion ││ Print-on-Demand)│
└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘
```

### Source 1: High-Performance Display Ad Networks
1. **Google AdSense:**
   - Best for global traffic (supports auto-ads, responsive display, and mobile anchor ads).
   - Expected RPM: **$2.00 – $7.00 per 1,000 pageviews** (depending on US/EU vs Tier-3 traffic).
2. **Carbon Ads / BuySellAds:**
   - Best for creative, design, and developer audiences.
   - Minimalist, elegant single-unit tech ads that users rarely block with AdBlock.
   - High CPM ($2.00 – $4.00 flat CPM on design tools).
3. **Mediavine / Raptive (Formerly AdThrive):**
   - Once PolishAI reaches 50,000+ monthly sessions, transition from AdSense to Mediavine.
   - Premium US RPMs reach **$15.00 – $35.00 per 1,000 sessions**.

### Source 2: "Rewarded Video / Micro-Task" for Premium Unlocks
Instead of charging a subscription right away, allow users to unlock premium features by viewing a 15-second sponsor video or interactive ad:
* **Feature Unlocks:**
  - *Bulk Batch Process 20+ Images at once* → Watch 1 quick sponsor clip.
  - *Ultra-HD 4K Upscale / Export* → Watch 1 quick sponsor clip.
* **Financial Value:** Rewarded video ads on mobile and desktop web pay **$15.00 – $35.00 eCPM** (10× higher than standard static banners).

### Source 3: Affiliate Partnerships & E-Commerce Integrations
When users remove a background or create a cutout, what do they intend to do with it?
1. **E-Commerce Sellers:** Selling products on Amazon, eBay, Shopify, Etsy.
   - **Monetization:** Embed a banner or button: *"Sell this product on Shopify — Start for $1/month"* (Shopify pays **$50 to $150 per paid referral**!).
2. **Print-on-Demand (Merch):** People cut out their pets, cars, or children to print on mugs, t-shirts, and stickers.
   - **Monetization:** Add a button in the Export panel: *"Print on T-Shirt / Mug (Printful / Gelato API)"*. You earn **15% – 25% profit margin** on every physical order without holding any inventory.
3. **Creative Tool Referrals:**
   - Canva Affiliate Program: Earn $36 per Canva Pro signup.

### Source 4: Freemium "PolishAI Pro" ($4.99/mo or $29/year)
Offer a simple, irresistible upgrade for power users and small business owners:
* **Free Tier:** 100% free, unlimited client-side RMBG-1.4 cutouts, supported by non-intrusive ads.
* **Pro Tier ($4.99/mo via Stripe / LemonSqueezy):**
  - Completely **100% Ad-Free experience**.
  - One-click Batch Zip Export (unlimited).
  - Priority Cloud Generative Inpainting & Magic Eraser.
  - 4K Ultra-Resolution Export.
  - Commercial license badge.
* *Even a conservative 1.5% conversion rate on 50,000 monthly visitors generates **$3,742/month in pure recurring revenue**.*

---

## 4. Projected Unit Economics & Revenue Forecast

Because PolishAI's infrastructure costs are virtually **$0**, almost every dollar earned goes directly to gross profit.

### Revenue & Profit Model at Varying Traffic Tiers
| Metric | Stage 1: Launch | Stage 2: Growth | Stage 3: Scale | Stage 4: Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Visitors (MAU)** | 10,000 | 50,000 | 200,000 | 1,000,000 |
| **Monthly Pageviews** | ~30,000 | ~180,000 | ~800,000 | ~4,500,000 |
| **Ad Revenue (AdSense @ $4.50 RPM)**| $135 | $810 | $3,600 | $20,250 |
| **Rewarded Ad Revenue (@ $20 eCPM)**| $40 | $240 | $1,200 | $7,000 |
| **Affiliate Earnings (Shopify/Print)**| $100 | $600 | $2,800 | $14,000 |
| **Pro Subscribers (1.2% @ $4.99/mo)**| $600 (120 users) | $3,000 (600 users) | $12,000 (2.4k users) | $60,000 (12k users) |
| **Total Gross Revenue** | **$875 / mo** | **$4,650 / mo** | **$19,600 / mo** | **$101,250 / mo** |
| **Server & Hosting Costs (Vercel/CF)** | **$0.00** | **$20.00** (Vercel Pro) | **$40.00** | **$150.00** |
| **Net Developer Profit Margin** | **99.9%** | **99.5%** | **99.7%** | **99.8%** |

---

## 5. Hostinger VPS Capacity Analysis & Cloud Database Architecture

### A. Reality Check on your Hostinger KVM 1 VPS
Based on your Hostinger dashboard (`srv1282976.hstgr.cloud`):
* **Hardware Specs:** **1 vCPU Core**, **4 GB RAM**, **50 GB NVMe Disk**.
* **Active Status Warning:** ⚠️ **`🔴 CPU limitation activated. Limitation may affect your VPS performance.`**
* **Existing Project:** A media downloader (Backend + Frontend + `yt-dlp` / FFmpeg).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      YOUR HOSTINGER KVM 1 (1 vCPU / 4 GB RAM)          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Base Ubuntu OS + Docker + Dokploy Panel   →  ~600 MB RAM            │
│ 2. Tool 1: Media Downloader (Backend + yt-dlp)→  ~800 MB - 1.5 GB RAM   │
│    ⚠️ Spikes CPU to 100% during video downloads & transcoding           │
│ 3. Tool 2: PolishAI (Next.js Application)    →  ~350 MB - 500 MB RAM   │
│ 4. Tool 3: Local Database Container (DB)     →  ~400 MB - 700 MB RAM   │
├────────────────────────────────────────────────────────────────────────┤
│ TOTAL RAM DEMAND: ~2.8 GB – 3.8 GB (DANGEROUSLY CLOSE TO 4 GB LIMIT)   │
│ DANGER: Linux OOM Killer will forcefully kill Database or Node.js!      │
└────────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **Do NOT run a local database container on this VPS!**
> `yt-dlp` / FFmpeg video downloads spike single-core CPU usage to 100%, which triggers Hostinger's automatic CPU throttling. If a database is running on the same VPS, database queries will time out, causing `504 Gateway Timeout` errors, and the Linux kernel Out-Of-Memory (OOM) killer will crash your containers.

---

### B. The Cloud Database Solution: Google Firebase (Spark Free Tier)
Offload the database completely to **Google Firebase** (or **MongoDB Atlas Free M0**). It consumes **0 MB RAM and 0% CPU on your Hostinger VPS**, ensuring 100% uptime.

#### Firebase Spark Free Quota Breakdown ($0.00 / Month Forever):
| Service | Free Quota Every Day / Month | Capacity for PolishAI |
| :--- | :--- | :--- |
| **Cloud Firestore Storage** | **1 GB** stored data | Over **10,000,000 tracking records** (~100 bytes each). |
| **Firestore Document Reads**| **50,000 reads / DAY** | 50,000 credit checks and profile loads every 24 hours. |
| **Firestore Document Writes**| **20,000 writes / DAY**| 20,000 background removals / edits per day. |
| **Firebase Authentication** | **50,000 MAUs** (Monthly Active Users)| 1-Click Google Sign-In & Email login included free. |
| **Cloud Storage** | **5 GB storage** + **1 GB download/day**| Storing user presets and profile avatars. |

---

## 6. The 7 Quota-Saving Strategies: Stretch Free Quota to 50,000+ Daily Users

To never hit the 50k read / 20k write daily ceiling, implement this hybrid architecture:

### Strategy 1: "Guest-First" LocalStorage Pattern (0 Database Calls for 85% of Users)
85% of visitors are drive-by users testing 1–2 cutouts. **Never touch Firebase for unauthenticated visitors!**
* Keep guest trial credits (`5 free cutouts/day`) in browser `localStorage`.
* Read and increment in pure JavaScript memory (0ms latency, 0 Firestore reads, 0 Firestore writes).
* Only when guest credits reach 0, prompt: *"You've used your 5 free guest cutouts today! Sign in with Google to get 25 more daily credits."*

```typescript
// lib/usageTracker.ts - Guest LocalStorage Engine
export function getGuestCredits(): { used: number; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem('polish_guest_usage') || '{}');

  if (stored.date !== today) {
    localStorage.setItem('polish_guest_usage', JSON.stringify({ date: today, used: 0 }));
    return { used: 0, remaining: 5 };
  }
  return { used: stored.used, remaining: Math.max(0, 5 - stored.used) };
}

export function incrementGuestUsage(): boolean {
  const { remaining } = getGuestCredits();
  if (remaining <= 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem('polish_guest_usage') || '{}');
  stored.used = (stored.used || 0) + 1;
  localStorage.setItem('polish_guest_usage', JSON.stringify(stored));
  return true; // 0 Firebase reads, 0 Firebase writes!
}
```

### Strategy 2: Enable Firebase Persistent Local Cache (Free Cache Reads)
Enable IndexedDB offline persistence. When a user navigates between tabs or refreshes, **Firestore reads from browser disk without consuming your 50k read quota**:

```typescript
// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() // Shared cache across all open browser tabs
  })
});
export const auth = getAuth(app);
```

### Strategy 3: Single-Session In-Memory Caching (Read Once on Login)
* When a user logs in, fetch their `/users/{uid}` document **once**.
* Store it in React Context / Zustand / `sessionStorage`.
* When moving between `/image-bg-removal`, `/image-editing`, and `/gif-maker`, read from memory.
* **Quota Saved:** Cuts read operations from 15 reads per session down to **1 single read**.

### Strategy 4: Batched / Atomic Writes (Don't Write on Every Pixel)
* When a user processes a batch of 10 photos, do not call `updateDoc()` 10 times.
* Decrement local state instantly for 60fps UI feedback, and perform **1 atomic update** when the user clicks "Download":
```typescript
import { doc, updateDoc, increment } from "firebase/firestore";

// Single atomic write for all 10 images!
await updateDoc(doc(db, "users", user.uid), {
  credits: increment(-10),
  totalCutouts: increment(10),
  lastActive: new Date()
}); // Consumes 1 write quota instead of 10!
```

### Strategy 5: The "Single Document" Architecture
Keep all profile data, credit balance, and plan settings in one document (`/users/{uid}`):
```json
{
  "email": "creator@gmail.com",
  "plan": "free",
  "isProUser": false,
  "credits": 25,
  "lastResetDate": "2026-10-05"
}
```
* Fetching this document costs **1 read** for Auth, Pro status, and Credits combined.

### Strategy 6: Lazy-Loaded History & Analytics
Never fetch past export logs on home page load. Only query history when the user explicitly opens an "Export History" modal.

### Strategy 7: Conditional Updates
Before saving settings, compare with cached state: `if (newSettings === oldSettings) return;`. Skip the network call if nothing changed.

---

## 7. Connecting Database with Ads & Pro Freemium

Here is how the Firebase user profile seamlessly controls the Ad system:

```
┌────────────────────────────────────────────────────────┐
│                   POLISHAI USER STATE                  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ FREE / GUEST USER         │ │ PRO SUBSCRIBER ($4.99/MO) │
│ • isProUser = false       │ │ • isProUser = true        │
│ • Render <AdSlot />       │ │ • Hide ALL <AdSlot />     │
│ • Rewarded Ads enabled    │ │ • Unlimited Batch ZIP     │
│ • 10-25 daily credits     │ │ • Priority Cloud AI       │
└───────────────────────────┘ └───────────────────────────┘
```

### Clean React Ad Component Linked to User State (`components/ads/AdSlot.tsx`)
```tsx
"use client";

import React, { useEffect, useRef } from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
  isProUser?: boolean; // Synced with Firebase user.isProUser
}

export default function AdSlot({ slotId, format = 'auto', className = '', isProUser = false }: AdSlotProps) {
  // If user is subscribed to Pro via Stripe/LemonSqueezy, never render ads!
  if (isProUser) return null;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("AdSense pending or ad-block active:", e);
    }
  }, [slotId]);

  return (
    <div className={`ad-container overflow-hidden rounded-xl border border-white/5 bg-[#091528]/40 text-center ${className}`}>
      <span className="block text-[9px] uppercase tracking-widest text-slate-500 py-1">Sponsored</span>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

### Rewarded Ad: Watch Video to Unlock 5 Free Credits
```typescript
export async function handleRewardedAdComplete(userId: string) {
  // Add 5 bonus credits to Firebase after verified ad view
  await updateDoc(doc(db, "users", userId), {
    credits: increment(5),
    rewardedAdsWatchedToday: increment(1)
  });
  toast.success("+5 Bonus Credits added to your account!");
}
```

---

## 8. Step-by-Step Launch & Approval Checklist

### Step 1: Legal Compliance (Mandatory for AdSense Approval)
Google AdSense will reject sites that do not have mandatory policy pages. You must have:
* [x] **Privacy Policy** (`/privacy`): Clearly state that images are processed client-side and never saved on servers. Mention Google AdSense cookie usage.
* [x] **Terms of Service** (`/terms`): Fair use and disclaimer.
* [x] **Contact / About Us Page** (`/about`): Real developer contact email.
* [x] **Cookie Consent Banner**: Implement a GDPR/CCPA compliant consent banner.

### Step 2: Apply for Google AdSense
1. Add your custom domain (`https://www.polishai.in`). Custom domains get approved within 48–72 hours.
2. Place the `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..." crossorigin="anonymous"></script>` in `app/layout.tsx`.
3. Submit for review.

### Step 3: Implement Strategic Placements
1. Start with **Placement 2 (Post-Download Success Modal)** and **Placement 3 (Sidebar Bottom)**.
2. Enable Google **Auto-Ads** with "Wide screens" and "Vignette ads" enabled, but set ad frequency slider to "Low / Moderate" to prevent screen clutter.

### Step 4: Add Affiliate Links & LemonSqueezy
1. Register for **Shopify Affiliates** and **Printful Print-on-Demand API**.
2. Add a *"Sell on Shopify"* and *"Print on Merch"* button inside the Export panel.
3. Integrate **LemonSqueezy** or **Stripe Checkout** for a $4.99/mo "Remove Ads & Pro Badge" subscription.

---

## Summary of Immediate Next Steps

1. **Deploy PolishAI on Hostinger VPS:** Run PolishAI inside a Docker container on your VPS (~350 MB RAM).
2. **Connect Google Firebase (Spark Free):** Keep the database off the VPS to avoid CPU throttling and memory exhaustion.
3. **Use Guest LocalStorage:** 85% of users will consume 0 reads and 0 writes.
4. **Deploy AdSlot Components:** Connect Google AdSense using the non-intrusive zones documented above.

