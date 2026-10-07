import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/pelaporan/:kegiatanId/:fase',
        destination: '/pelaporan/:kegiatanId',
        permanent: false,
      },
    ]
  },
}

export default nextConfig;
