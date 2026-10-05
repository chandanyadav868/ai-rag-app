export const AD_CONFIG = {
  // Google AdSense Client ID (replace with your approved publisher ID: ca-pub-XXXXXXXXXXXXXXXX)
  CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-9999999999999999",

  // Set to true in development to show neat preview slots
  DEMO_MODE: process.env.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_ADSENSE_ID,

  // Slot IDs mapped to the 5 High-Conversion Zones from plan.md
  SLOTS: {
    SIDEBAR_RECTANGLE: "div-gpt-ad-sidebar-300x250",
    EXPORT_MODAL_RECTANGLE: "div-gpt-ad-export-300x250",
    PROCESSING_PROGRESS: "div-gpt-ad-progress-card",
    MOBILE_BOTTOM_ANCHOR: "div-gpt-ad-mobile-anchor",
    HOME_LEADERBOARD: "div-gpt-ad-leaderboard-728x90"
  },

  // High-Paying Affiliate Partner Integrations (Shopify $150 referral, Printful Print-on-Demand)
  AFFILIATES: {
    SHOPIFY_TRIAL_URL: "https://www.shopify.com/free-trial?ref=polishai",
    PRINTFUL_MERCH_URL: "https://www.printful.com/custom-products?ref=polishai",
    CANVA_PRO_URL: "https://partner.canva.com/polishai"
  }
};
