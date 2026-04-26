import Headers from "@/components/Header";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* header */}
      <Headers />
      <div>{children}</div>
    </>
  )
}
