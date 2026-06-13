import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://worldcup.makeacompany.ai/sitemap.xml",
    host: "https://worldcup.makeacompany.ai",
  };
}
