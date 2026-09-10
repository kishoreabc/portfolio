import { getSiteUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/favicon.ico", "/icon-*.png", "/apple-touch-icon.png", "/site.webmanifest"],
        disallow: ["/admin", "/admin/*", "/api/auth/*"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/favicon.ico", "/icon-*.png", "/apple-touch-icon.png"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
