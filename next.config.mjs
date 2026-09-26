/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel requires the standard .next output directory. Keep local
  // production builds isolated from a running development server.
  distDir:
    process.env.VERCEL === "1"
      ? ".next"
      : process.env.NODE_ENV === "production"
        ? ".next-build"
        : ".next",
};

export default nextConfig;
