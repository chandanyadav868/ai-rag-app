import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online GIF Maker - Create Professional GIFs from Images | Polish AI",
  description: "Easily create high-quality GIFs from your images. Add effects, adjust timing, and export professional GIFs in seconds. Pro tools for free.",
  keywords: ["Online GIF Maker", "Create GIF from images", "Free GIF creator", "GIF editor online", "Professional GIF studio"],
  openGraph: {
    title: "Online GIF Maker - Create Professional GIFs from Images",
    description: "The ultimate tool for creating smooth, high-quality GIFs in your browser.",
    type: "website",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
