/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid intermittent Windows file-lock errors on .next/trace in synced folders.
  distDir: ".next-cache",
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://patent-ipr-backend-express.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
