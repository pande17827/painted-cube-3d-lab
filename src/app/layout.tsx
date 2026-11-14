import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Painted Cube 3D Lab — visualize n³ cube cutting live",
  description:
    "Interactive 3D visualization of the classic painted-cube problem: paint a cube, cut it into n×n×n smaller cubes, explode it, filter by painted faces and verify 8 + 12(n−2) + 6(n−2)² + (n−2)³ = n³ live.",
  keywords: ["painted cube", "cube cutting", "3D visualization", "n cubed", "mensuration", "Three.js"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "The Painted Cube 3D Lab",
    description: "Explode, filter and count every painted face of a cut cube — in interactive 3D.",
    siteName: "Z.ai",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
