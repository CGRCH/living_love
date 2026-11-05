import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.FRONTEND_URL || "http://localhost:3000";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/categoria/livings`, lastModified: new Date() },
    { url: `${base}/cotizar`, lastModified: new Date() },
  ];
}
