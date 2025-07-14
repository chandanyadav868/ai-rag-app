import type { Metadata } from "next";
import LocalFont from "next/font/local";
import './globals.css'

const geistMono = LocalFont({
  src:'./fonts/GeistMonoVF.woff',
  variable:'--font-geist-mono',
  weight:'100 900'
})

const geistSans = LocalFont({
  src:'./fonts/GeistVF.woff',
  variable:'--font-geist-sans',
  weight:'100 900'
})

export const metadata:Metadata = {
  title:'Scrowling Website',
  description:'This website for the scrawling the page of website'
}


export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
  return(
    <html lang="en">
      <body>
        <div className={`${geistMono.variable} ${geistSans.variable} antialiased`}>{children}</div>
      </body>
    </html>
  )
}
