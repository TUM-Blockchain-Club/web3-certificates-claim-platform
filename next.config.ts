import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/certificates/[certificateId]/pdf": [
      "./public/certificate-assets/fonts/*.ttf",
      "./public/tbc-wordmark.png",
      "./public/web3-talents-logo.png",
    ],
  },
};

export default nextConfig;
