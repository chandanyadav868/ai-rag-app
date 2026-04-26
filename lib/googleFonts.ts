"use client";

// Lightweight wrapper around WebFont Loader (webfontloader)
// Ensures a requested Google font family is loaded before applying it.

export async function loadGoogleFont(family: string, variants: string[] = ["400", "700"]): Promise<void> {
  try {
    const WebFont = (await import('webfontloader')).default;
    return new Promise((resolve, reject) => {
      let finished = false;
      const families = [`${family}:${variants.join(',')}`];

      WebFont.load({
        google: { families },
        timeout: 5000,
        active: () => {
          if (finished) return;
          finished = true;
          resolve();
        },
        inactive: () => {
          if (finished) return;
          finished = true;
          // still resolve so the UI falls back gracefully
          resolve();
        },
      });

      // Safety timeout in case loader hangs
      setTimeout(() => {
        if (finished) return;
        finished = true;
        resolve();
      }, 6000);
    });
  } catch (err) {
    // If webfontloader isn't available or fails, just resolve so caller can continue
    return Promise.resolve();
  }
}
