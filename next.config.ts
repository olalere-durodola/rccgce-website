import type { NextConfig } from "next";
import redesignRoutes from "./redesign/routes.json";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/redesign-content/*": ["./redesign/dist/**/index.html"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...Object.entries(redesignRoutes).map(([key, entry]) => ({
          source: entry.path,
          destination: `/redesign-content/${key}`,
        })),
        {source: "/assets/:path*", destination: "/redesign-assets/assets/:path*"},
        ...["app.mjs", "logic.mjs", "media-config.mjs", "video.mjs", "youtube-api.mjs", "styles.css"].map(file => ({
          source: `/${file}`,
          destination: `/redesign-assets/${file}`,
        })),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
