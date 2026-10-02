import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chunithm-net-eng.com',
        pathname: '/mobile/img/**',
      },
    ],
  },
// 기존 설정들이 있다면 유지하고 아래 rewrites를 추가합니다.
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://chunishift.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;