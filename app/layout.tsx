import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LabChain - Scientific Reproducibility & Collaboration Platform",
  description: "A platform for scientific reproducibility, collaboration, and protocol management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 lg:ml-64">
            <Topbar />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
