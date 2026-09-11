import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VoiceAgent } from "@/components/ai/VoiceAgent";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kishoreabc.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kishore R",
    template: "%s | Kishore R",
  },
  description:
    "Official portfolio and personal website of Kishore R (Kishore), Aspiring AI/ML and Generative AI Engineer specializing in RAG pipelines, LLMs, multimodal AI, and intelligent systems. Based in Salem, Tamil Nadu, India. Explore Kishore's projects, articles, code, and open-source contributions.",
  keywords: [
    // Primary Name Variations for Search Engines
    "Kishore",
    "Kishore R",
    "kishore",
    "kishore r",
    "kishoreabc",
    "kishorehp134",
    "Kishore Salem",
    "Kishore Tamil Nadu",
    "Kishore India",
    "Kishore Bannari Amman",
    "Kishore BIT",

    // Portfolio & Identity Searches
    "Kishore Portfolio",
    "Kishore R Portfolio",
    "Kishore Website",
    "Kishore R Website",
    "Kishore Official Website",
    "Kishore Developer",
    "Kishore Software Engineer",
    "Kishore AI Developer",
    "Kishore GitHub",
    "Kishore LinkedIn",
    "Kishore LeetCode",

    // AI/ML Engineering & Tech Specialties
    "Kishore AI",
    "Kishore R AI",
    "Kishore AI Engineer",
    "Kishore ML Engineer",
    "AI/ML Engineer",
    "Generative AI Engineer",
    "RAG Engineer",
    "LLM Specialist",
    "Multimodal AI",
    "Deep Learning Engineer",
    "Machine Learning Engineer India",
    "Full Stack AI Developer",
    "Python AI Developer",
    "LangChain",
    "LangGraph",
    "FastAPI",
    "Next.js",
    "Data Structures and Algorithms",
  ],
  authors: [{ name: "Kishore R", url: siteUrl }],
  creator: "Kishore R",
  publisher: "Kishore R",
  applicationName: "Kishore R Portfolio",
  category: "technology",
  openGraph: {
    type: "profile",
    firstName: "Kishore",
    lastName: "R",
    username: "kishoreabc",
    gender: "male",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Kishore R Portfolio",
    title: "Kishore R | Aspiring AI/ML & Generative AI Engineer | Kishore Portfolio",
    description:
      "Official portfolio and personal website of Kishore R (Kishore), an Aspiring AI/ML & Generative AI Engineer specializing in RAG pipelines, LLMs, multimodal AI, and intelligent systems.",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Kishore R Portfolio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kishore R | Aspiring AI/ML & Generative AI Engineer | Kishore Portfolio",
    description:
      "Official portfolio of Kishore R (Kishore). Building intelligent systems with RAG, multimodal AI, LLMs, and Generative AI.",
    creator: "@kishoreabc",
    site: "@kishoreabc",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { prisma } from "@/lib/db";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let config = null;
  let socialLinks: { platform: string; url: string }[] = [];
  try {
    const results = await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: "singleton" } }),
      prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { displayOrder: "asc" } }),
    ]);
    config = results[0];
    socialLinks = results[1];
  } catch {}

  const dynamicSameAs = socialLinks.map((s) => s.url).filter(Boolean);
  const contactEmail = config?.contactEmail;
  const phone = config?.phone;
  const name = config?.name || "Kishore R";
  const headline = config?.headline || "Aspiring AI/ML & Generative AI Engineer";
  const bio = config?.bio || config?.aboutText || "";
  const location = config?.location || "Salem, Tamil Nadu, India";
  const [city = "Salem", state = "Tamil Nadu", country = "IN"] = location.split(",").map((s) => s.trim());

  const dynamicJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: `${name} — Portfolio`,
        alternateName: ["Kishore", "Kishore R", "Kishore Portfolio", "kishoreabc.dev", "kishoreabc"],
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profilepage`,
        url: siteUrl,
        name: `${name} | ${headline} Profile`,
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#person`,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name,
        jobTitle: headline,
        description: bio,
        url: siteUrl,
        image: config?.avatarUrl || `${siteUrl}/icon-512x512.png`,
        logo: `${siteUrl}/icon-512x512.png`,
        email: contactEmail ? `mailto:${contactEmail}` : undefined,
        telephone: phone || undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: state,
          addressCountry: country,
        },
        sameAs: dynamicSameAs,
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning // Required for next-themes to avoid FOUC
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden w-full max-w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
            <VoiceAgent />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
