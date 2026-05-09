import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Image Editor - AI-Powered Photo Studio | Polish AI",
  description: "Advanced online photo editor with AI object removal, background tools, and professional filters. Everything runs 100% in your browser for total privacy.",
  keywords: ["Pro Image Editor", "AI Photo Studio", "Online Image Editor", "AI Object Removal", "Browser Image Editor", "Professional Photo Editing"],
  openGraph: {
    title: "Pro Image Editor - AI-Powered Photo Studio",
    description: "Professional image editing with state-of-the-art AI features, 100% in your browser.",
    type: "website",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
