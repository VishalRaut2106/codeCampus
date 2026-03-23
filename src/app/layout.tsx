import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import HydrationBoundary from "@/components/HydrationBoundary";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { ErrorLoggingInitializer } from "@/components/ErrorLoggingInitializer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodePVG - College Coding Platform",
  description: "A professional coding platform exclusively for college students to solve problems, track progress, compete in contests, and maintain daily coding streaks.",
  keywords: ["coding", "programming", "college", "contests", "problems", "leetcode", "coding platform"],
  authors: [{ name: "CodePVG Team" }],
  openGraph: {
    title: "CodePVG - College Coding Platform",
    description: "A professional coding platform exclusively for college students",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body 
        className="antialiased bg-background text-foreground min-h-screen"
        suppressHydrationWarning={true}
      >
        <ErrorLoggingInitializer />
        <HydrationBoundary>
          <ErrorBoundary>
            <ConditionalNavbar />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
              },
            }}
          />
        </HydrationBoundary>
      </body>
    </html>
  );
}
