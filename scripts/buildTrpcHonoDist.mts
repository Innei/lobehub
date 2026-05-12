import { rm } from 'node:fs/promises';

import { build, type Plugin } from 'esbuild';

const external = [
  '@img/sharp-*',
  '@napi-rs/canvas',
  '@napi-rs/canvas-*',
  'canvas',
  'sharp',
];

const nextRuntimeShimPlugin: Plugin = {
  name: 'next-runtime-shim',
  setup(build) {
    build.onResolve({ filter: /^next\/(headers|server)$/ }, ({ path }) => ({
      namespace: 'next-runtime-shim',
      path,
    }));

    build.onLoad({ filter: /^next\/headers$/, namespace: 'next-runtime-shim' }, () => ({
      contents: `
        const createReadonlyStore = () => ({
          clear() {},
          delete() {},
          get() { return undefined; },
          getAll() { return []; },
          has() { return false; },
          set() {},
          toString() { return ''; },
        });

        export const headers = async () => new Headers();
        export const cookies = async () => createReadonlyStore();
      `,
      loader: 'js',
    }));

    build.onLoad({ filter: /^next\/server$/, namespace: 'next-runtime-shim' }, () => ({
      contents: `
        export class NextResponse extends Response {
          static json(body, init) {
            return Response.json(body, init);
          }

          static next(init) {
            return new NextResponse(null, init);
          }

          static redirect(url, init) {
            return Response.redirect(url, typeof init === 'number' ? init : init?.status);
          }
        }

        export const after = (callback) => {
          queueMicrotask(callback);
        };
      `,
      loader: 'js',
    }));
  },
};

await rm('packages/hono-dist-bench/dist', { force: true, recursive: true });

await build({
  banner: {
    js: `import { createRequire as __createRequire } from 'node:module';const require = __createRequire(import.meta.url);`,
  },
  bundle: true,
  entryPoints: ['src/server/trpc-hono/dist-entry.ts'],
  external,
  format: 'esm',
  loader: {
    '.md': 'text',
  },
  logLevel: 'info',
  outfile: 'packages/hono-dist-bench/dist/index.mjs',
  platform: 'node',
  plugins: [nextRuntimeShimPlugin],
  target: 'node24',
});
