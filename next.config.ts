import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/certificates/[certificateId]/pdf": [
      "./public/certificate-assets/fonts/*.ttf",
      "./public/certificate-assets/templates/*.pdf",
      "./public/tbc-wordmark.png",
    ],
  },
};

export default nextConfig;
