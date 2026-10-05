"use client";

// Clean, native Google Font Loader
// Injects stylesheet and checks font loading with document.fonts without any external dependencies

export async function loadGoogleFont(family: string, variants: string[] = ["400", "700"]): Promise<void> {
  if (typeof window === "undefined" || !family) return;

  try {
    const formattedFamily = family.trim().replace(/ /g, "+");
    const linkId = `google-font-${formattedFamily.toLowerCase()}`;

    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@${variants.join(";")}&display=swap`;
      document.head.appendChild(link);
    }

    if ("fonts" in document) {
      await Promise.race([
        (document as any).fonts.load(`16px "${family}"`),
        new Promise((resolve) => setTimeout(resolve, 3000)), // timeout fallback
      ]);
    }
  } catch (err) {
    // Graceful fallback to system font
  }
}
