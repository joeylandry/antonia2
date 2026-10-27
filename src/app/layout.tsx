import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Antonia Training", template: "%s · Antonia Training" },
  description: "Client management and progress tracking for personal trainers.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1320" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
