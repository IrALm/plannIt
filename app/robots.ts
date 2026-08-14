import type { MetadataRoute } from "next";

const SITE_URL = "https://plann-it-cyan.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/login", "/register", "/forgot-password"],
      disallow: ["/dashboard", "/onboarding", "/settings", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
