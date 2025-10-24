'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { TickerBar } from '@/components/TickerBar';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          <TickerBar />
          <div className="pt-12">
            {children}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
