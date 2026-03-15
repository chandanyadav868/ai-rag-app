import Headers from "@/components/Header";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* header */}
            <Headers />
            <div>{children}</div>
      </body>
    </html>
  )
}
