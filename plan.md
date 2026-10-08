# Architecture & Implementation Plan: AI Background Removal Optimization & Action Panel Upgrade

**Target Modules:**  
1. `app/image-bg-removal/page.tsx` (Studio Preview & Action Controls)  
2. `app/image-editing/_hooks/useBackgroundRemoval.ts` (Shared Background Removal Hook)  
3. `app/image-editing/_workers/backgroundRemoval.worker.ts` (Web Worker & ONNX Neural Engine)  
4. `app/image-editing/_components/` & `app/gif-maker/_components/` (Shared Consumers)  

---

## 1. Root Cause Analysis: Why Does the UI Freeze & Jitter?

When clicking "Remove Background" or loading the AI model, the webpage experiences stuttering, frozen scrolling, and a noticeable "jitter effect." Here is the exact technical reason:

### Root Cause 1: 100% CPU Core Saturation by ONNX Runtime Web
- The application executes deep neural networks (**briaai/RMBG-1.4** ~170MB weights, and **Xenova/clipseg**) directly client-side inside the user's browser using `@huggingface/transformers` backed by ONNX Runtime Web (WASM).
- By default, ONNX Runtime Web's WebAssembly backend spawns multi-threaded worker threads matching `navigator.hardwareConcurrency` (e.g., 8, 12, or 16 threads).
- During model compilation, tensor transformation, and matrix multiplication, **all CPU cores are pegged at 100% capacity**.
- This starves the browser's **Compositor Thread** and **Main Event Loop** of CPU time, resulting in dropped frames (from 60fps down to 5-10fps), unresponsive cursor input, and violent scroll jank ("jitter effect").

### Root Cause 2: Unlocked Scrolling During Intensive Execution
- In `image-bg-removal/page.tsx`, the loading overlay is confined only to `absolute inset-0` within the preview container.
- The document body (`window`) is never locked. If the user moves a finger or scrolls the mouse wheel while the CPU is saturated, touch and scroll events queue up and trigger delayed, jerky scroll jumps.

### Root Cause 3: High-Frequency React State Updates
- During model downloading and inference, worker `progress_callback` messages fire dozens of times per second.
- In `useBackgroundRemoval.ts`, every message directly triggers `setProgress` and `setProgressPercent`, causing rapid top-level React re-renders while the CPU is already under peak stress.

---

## 2. Solution: How We Will Fix the Freezing & Jitter

### A. ONNX Thread Pool Optimization (Worker Level)
- In `backgroundRemoval.worker.ts`, configure `env.backends.onnx.wasm.numThreads`:
  ```ts
  const totalCores = self.navigator?.hardwareConcurrency || 4;
  env.backends.onnx.wasm.numThreads = Math.max(1, Math.min(4, Math.floor(totalCores / 2)));
  ```
- **Why this works:** Leaving 1 to 2 cores completely free for the browser's UI thread and compositor ensures the browser stays responsive at 60 FPS, maintaining fluid animations and smooth interactions without freezing the operating system or browser tab.

### B. Global Screen & Scroll Lock During Processing
- In `useBackgroundRemoval.ts`, implement an automatic body scroll-lock effect:
  - When `status === 'processing'` or `status === 'loading'`, apply `document.body.style.overflow = 'hidden'` (and `touch-action: none`) to prevent scroll jank and touch jitter.
  - When execution completes (`'ready'`, `'complete'`, or `'error'`), cleanly restore scrolling.
- In `image-bg-removal/page.tsx`, ensure the processing overlay displays a unified, smooth glassmorphic lock screen with clear progress feedback so the user understands the AI is computing without seeing any page jitter.

### C. Worker Message Throttling
- Throttle progress updates sent from the worker to the main thread (minimum 80ms interval) to avoid React re-render thrashing.

### D. Unified Across All Tools
- Because `app/image-editing` (`MaskStudio.tsx`, `AIFeatures.tsx`) and `app/gif-maker` (`MaskStudio.tsx`, `AIFeatures.tsx`) both consume `useBackgroundRemoval.ts` and `backgroundRemoval.worker.ts`, all these performance enhancements and scroll-locking protections will automatically apply to **Image Editing** and **GIF Maker** as well.

---

## 3. UI Redesign: Replacing "Download PNG" with the 4 Action Buttons

### Current State (Image 1)
- In the mobile / primary action bar under the preview image:
  - `[ Download PNG ]` (Gradient button)
  - `[ Re-run AI ]` (Secondary button)
- Clicking "Download PNG" only offers a single download option.

### Desired State (Image 2 Alignment)
- Remove the single `[ Download PNG ]` button.
- Render `[ Re-run AI ]` alongside/above the full **Export & Actions** suite:
  1. **Cutout PNG** (`<Download />`): Downloads the transparent cutout PNG.
  2. **With Backdrop** (`<Download />`): Downloads the cutout composited with the selected background (color, gradient, blur, or shadow).
  3. **Copy to Clipboard** (`<Copy />` / `<Check />`): Copies the transparent cutout directly to the OS clipboard.
  4. **Open in Canvas** (`<ExternalLink />`): Direct bridge to `/image-editing` canvas studio with the cutout preloaded.
- Layout:
  - A clean, modern panel directly under the preview image:
    - **Header / Re-run Row:** `[ Re-run AI ]` button with loader state.
    - **Actions Grid (2x2):** The four buttons styled with subtle borders, hover glow, and active scale animations matching the design in Image 2.

---

## 4. Implementation Steps

1. **Update `app/image-editing/_workers/backgroundRemoval.worker.ts`**:
   - Set thread allocation limits for WASM/ONNX to preserve UI compositor responsiveness.
   - Add throttling to model download and inference progress notifications.

2. **Update `app/image-editing/_hooks/useBackgroundRemoval.ts`**:
   - Add automatic scroll-lock management (`document.body.style.overflow = 'hidden'`) during active background removal.
   - Ensure clean cleanup on unmount or processing completion.

3. **Update `app/image-bg-removal/page.tsx`**:
   - Replace the single `Download PNG` button under the image preview with the 4-button Export & Actions grid from Image 2:
     - `Cutout PNG`
     - `With Backdrop`
     - `Copy to Clipboard`
     - `Open in Canvas`
   - Position `Re-run AI` neatly above/alongside this action grid.
   - Ensure buttons are responsive across mobile and desktop viewports.
   - Enhance the processing overlay to provide smooth, locked UI feedback while the AI model executes.

4. **Verify `app/image-editing` and `app/gif-maker`**:
   - Verify that background removal in both tools inherits the scroll-lock and thread-optimization improvements without regressions.

5. **Build & Lint Verification**:
   - Run type checks and project build to ensure zero errors.
