import { defineConfig } from './src/libs/next/config/define-config';

const isVercel = !!process.env.VERCEL_ENV;

const vercelConfig = {
  // Vercel serverless optimization: exclude musl binaries from all routes
  // Vercel uses Amazon Linux (glibc), not Alpine Linux (musl)
  // This saves ~45MB (29MB canvas-musl + 16MB sharp-musl) per serverless function
  outputFileTracingExcludes: {
    '*': [
      'node_modules/.pnpm/@napi-rs+canvas-*-musl*',
      'node_modules/.pnpm/@img+sharp-libvips-*musl*',
      // Exclude SPA/desktop/mobile build artifacts from serverless functions
      'public/_spa/**',
      'dist/desktop/**',
      'dist/mobile/**',
      'apps/desktop/**',
      'packages/database/migrations/**',
    ],
  },
  outputFileTracingIncludes: {
    '/api/bench/hono-dist/\\[\\[\\.\\.\\.path\\]\\]': [
      './packages/hono-dist-bench/dist/**',
      './packages/hono-dist-bench/package.json',
    ],
  },
  serverExternalPackages: [
    '@chat-adapter/discord',
    '@discordjs/ws',
    '@lobechat/hono-dist-bench',
    '@napi-rs/canvas',
    'discord.js',
  ],
};
const nextConfig = defineConfig({
  ...(isVercel ? vercelConfig : {}),
});

export default nextConfig;
