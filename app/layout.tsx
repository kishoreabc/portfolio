import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kishore R — AI/ML & Generative AI Engineer",
    template: "%s | Kishore R",
  },
  description:
    "Portfolio of Kishore R, an AI/ML & Generative AI engineer specializing in RAG pipelines, multimodal AI, LLMs, and intelligent systems. Based in Salem, Tamil Nadu, India.",
  keywords: [
    "AI Engineer",
    "ML Engineer",
    "Generative AI",
    "RAG",
    "LLM",
    "Multimodal AI",
    "LangChain",
    "FastAPI",
    "Machine Learning",
    "Kishore R",
    "Portfolio",
  ],
  authors: [{ name: "Kishore R", url: "https://github.com/Kishoreabc" }],
  creator: "Kishore R",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "Kishore R — Portfolio",
    title: "Kishore R — AI/ML & Generative AI Engineer",
    description:
      "Portfolio of Kishore R, an AI/ML & Generative AI engineer specializing in RAG pipelines, multimodal AI, LLMs, and intelligent systems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kishore R — AI/ML & Generative AI Engineer",
    description:
      "Building intelligent systems with RAG, multimodal AI, LLMs, and Generative AI.",
    creator: "@KishoreR",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning // Required for next-themes to avoid FOUC
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
