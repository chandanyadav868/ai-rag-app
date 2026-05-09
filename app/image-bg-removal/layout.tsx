import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Background Remover - Instant Online Cutout | Polish AI",
  description: "Remove backgrounds from images instantly for free. Professional-grade AI cutout tool that runs 100% in your browser for total privacy. Batch processing supported.",
  keywords: ["AI Background Remover", "Remove bg online", "Transparent image cutout", "Free AI tool", "Batch background removal"],
  openGraph: {
    title: "Free AI Background Remover - Instant Online Cutout",
    description: "Remove image backgrounds instantly with our local-first AI neural engine.",
    type: "website",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
