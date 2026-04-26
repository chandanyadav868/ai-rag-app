import type { Metadata } from "next";
import LocalFont from "next/font/local";
import './globals.css'
import 'highlight.js/styles/github-dark.css'; // switched to dark theme
import ContextProvider from "@/components/CreateContext";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";


const geistMono = LocalFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})

const geistSans = LocalFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})

export const metadata: Metadata = {
  title: {
    default: 'Polish AI - Pro Image & GIF Studio',
    template: '%s | Polish AI'
  },
  description: 'The ultimate AI-powered creative studio. Edit images, remove objects, and create professional GIFs with our advanced online tools.',
  keywords: ['AI Image Editor', 'GIF Maker', 'Object Removal', 'AI Background Remover', 'Online Image Studio', 'Polish AI'],
  authors: [{ name: 'Polish AI Team' }],
  creator: 'Polish AI',
  publisher: 'Polish AI',
  metadataBase: new URL('https://polish-ai.com'), // Placeholder domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Polish AI - Pro Image & GIF Studio',
    description: 'Transform your photos with AI and create professional GIFs in seconds.',
    url: 'https://polish-ai.com',
    siteName: 'Polish AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polish AI - Pro Image & GIF Studio',
    description: 'The ultimate AI-powered creative studio for images and GIFs.',
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicorn/favicon.ico',
    apple: '/favicorn/apple-touch-icon.png',
  },
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <link rel="shortcut icon" href="favicorn/favicon.ico" type="image/x-icon" />
      <body>
        {/* header */}
        <SessionProvider>
          <ContextProvider>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className={`${geistMono.variable} ${geistSans.variable} antialiased`}>{children}</div>
          </ContextProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
