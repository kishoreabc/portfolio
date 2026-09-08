import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kishoreabc.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kishore R | Aspiring AI/ML & Generative AI Engineer | Kishore Portfolio",
    template: "%s | Kishore R",
  },
  description:
    "Official portfolio and personal website of Kishore R (Kishore), an AI/ML and Generative AI Engineer specializing in RAG pipelines, LLMs, multimodal AI, and intelligent systems. Based in Salem, Tamil Nadu, India. Explore Kishore's projects, articles, code, and open-source contributions.",
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
        url: "/icon.svg",
        width: 128,
        height: 128,
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Kishore R — Kishore Portfolio",
      alternateName: [
        "Kishore",
        "Kishore R",
        "Kishore Portfolio",
        "Kishore R Portfolio",
        "Kishore R AI",
        "kishoreabc",
        "kishoreabc.dev",
      ],
      description:
        "Official portfolio and personal website of Kishore R, Aspiring AI/ML & Generative AI Engineer.",
      publisher: {
        "@id": `${siteUrl}/#person`,
      },
      inLanguage: "en-US",
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#profilepage`,
      url: siteUrl,
      name: "Kishore R | Aspiring AI/ML & Generative AI Engineer Profile",
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
      name: "Kishore R",
      givenName: "Kishore",
      familyName: "R",
      additionalName: "Kishore",
      alternateName: [
        "Kishore",
        "kishore",
        "kishore r",
        "kishoreabc",
        "Kishore AI",
        "Kishore R AI",
        "Kishore AI Engineer",
        "Kishore Salem",
        "kishorehp134",
      ],
      jobTitle: "Aspiring AI/ML & Generative AI Engineer",
      description:
        "Kishore R (Kishore) is an Aspiring AI/ML & Generative AI Engineer specializing in RAG pipelines, LLMs, multimodal AI, and intelligent systems engineering.",
      url: siteUrl,
      image: `${siteUrl}/icon.svg`,
      email: "mailto:kishorehp134@gmail.com",
      telephone: "+918807303469",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Salem",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Bannari Amman Institute of Technology",
        url: "https://www.bitsathy.ac.in",
      },
      sameAs: [
        "https://github.com/Kishoreabc",
        "https://www.linkedin.com/in/kishoreabc/",
        "https://leetcode.com/u/KISHORE-R/",
        "https://twitter.com/kishoreabc",
      ],
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Generative AI",
        "Large Language Models (LLMs)",
        "Retrieval-Augmented Generation (RAG)",
        "Multimodal AI",
        "Deep Learning",
        "Natural Language Processing",
        "Next.js",
        "React",
        "TypeScript",
        "Python",
        "FastAPI",
        "Data Structures & Algorithms",
      ],
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
