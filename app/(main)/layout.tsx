import Headers from "@/components/Header";
import JsonLd from "@/components/JsonLd";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Polish AI",
    "operatingSystem": "All",
    "applicationCategory": "MultimediaApplication",
    "description": "Professional AI-powered creative studio for image editing, background removal, and GIF creation. Runs 100% locally in your browser for maximum privacy.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI Background Removal",
      "Professional GIF Maker",
      "Object Removal",
      "Image Editing Studio",
      "Local Browser Processing"
    ]
  };

  return (
    <>
      <JsonLd data={softwareSchema} />
      {/* header */}
      <Headers />
      <div>{children}</div>
    </>
  )
}
