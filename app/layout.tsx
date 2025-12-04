import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import AuthSessionProvider from "@/components/providers/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toast";

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
        <ErrorBoundary>
          <AuthSessionProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 lg:ml-64">
                <Topbar />
                <main>{children}</main>
              </div>
            </div>
            <Toaster />
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
