# Implementation Plan: Queue Deletion Bug Fix, Dual Download System & Duplicate Removal

**Target File:** `app/image-bg-removal/page.tsx`  
**Status:** Completed & Verified  

---

## 1. Problem Breakdown & Root Cause Analysis

### Issue A: Images in the Queue Auto-Deleting When Tapped (Images 1, 2, 3)
* **What happened:** In Image 1 there were 6 images; in Image 2 only 3 images remained; in Image 3 only 1 image remained.
* **Root cause:** 
  Inside the thumbnail queue card (`lines 1409–1422`):
  ```tsx
  <button
    onClick={(e) => {
      e.stopPropagation();
      setImages(prev => prev.filter(i => i.id !== item.id));
      ...
    }}
    className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <Trash2 size={11} />
  </button>
  ```
  On mobile touchscreen devices, `opacity-0` only hides the button visually—**`pointer-events` remain fully active**. Because each thumbnail is only 64×64px (`w-16 h-16`), when a user taps the thumbnail with their thumb to select/preview it, their touch hits the invisible trash button at the bottom-right. The click event is intercepted by `e.stopPropagation()` and immediately deletes the image from the queue!

### Issue B: Missing Clear Two-Button Download Controls
* **Requirement:**
  1. **Download Selected Image:** One-click instant download of the currently active image cutout.
  2. **Download All Images:** One-click batch download of all completed cutouts in the queue (ZIP).
* **Current state:** The download actions were spread across secondary panels and a small "ZIP" chip. Users need two clear, prominent buttons: one for single selected download and one for batch download of all images.

### Issue C: Duplicate "Export & Actions" Component at the Bottom (Image 4)
* **What happened:** In Image 4, right above the footer ("P" logo / Services), a duplicate "EXPORT & ACTIONS" panel appears.
* **Root cause:**
  The desktop sidebar has `order-2 lg:order-1`, which moves it to the bottom of the page on mobile viewports. Inside this sidebar (`lines 934–977`), the "Quick Actions Panel" renders "EXPORT & ACTIONS". Because we already render the action buttons under the preview image, it appears twice on mobile.

---

## 2. Proposed Implementation Steps

### Step 1: Fix the Queue Auto-Deletion Bug
1. Change the delete button on thumbnail cards to `pointer-events-none group-hover:pointer-events-auto` so it can **never** capture accidental taps while hidden.
2. Separate the click handling:
   - Tapping anywhere on the thumbnail card strictly calls `setActiveImageId(item.id)` to preview the image.
   - For mobile, add a clean, safe removal mechanism that cannot be triggered by accident.

### Step 2: Implement the Two Dedicated Download Buttons
Directly in the primary action bar under the preview image (and in the queue toolbar), provide two prominent, high-visibility download buttons:
1. **Button 1: `Download Cutout (Selected)`** (or `Download PNG`):
   - One-click download of the currently previewed image cutout.
   - Styled with a vibrant cyan/blue gradient and clear download icon.
2. **Button 2: `Download All Cutouts (ZIP)`**:
   - One-click batch download bundling all completed cutouts from the queue into a ZIP archive.
   - Displays the ready count badge (e.g., `Download All (6 Ready)`).
   - Styled with an emerald badge/button for clear distinction.
3. Keep the secondary options (`With Backdrop`, `Copy to Clipboard`, `Open in Canvas`, `Re-run AI`) neatly organized beneath these two primary download buttons.

### Step 3: Remove the Duplicate "Export & Actions" Panel from the Bottom
1. In the sidebar (`lines 934–977`), add `hidden lg:flex` to the Quick Actions Panel.
2. This ensures:
   - On **desktop**: The panel appears in its correct sidebar location.
   - On **mobile**: The panel is completely removed from the bottom of the page (Image 4 issue resolved), leaving only the primary action panel directly under the preview image.

---

## 3. Verification Plan
- Verify on mobile viewport:
  - Tapping thumbnails in the queue switches active image without deleting anything.
  - Clicking "Download Cutout" downloads the active image cutout.
  - Clicking "Download All (ZIP)" downloads all images in one click.
  - Scrolling to the bottom confirms no duplicate "Export & Actions" panel exists above the footer.
- Run `npx tsc --noEmit` to ensure zero compilation or type errors.
