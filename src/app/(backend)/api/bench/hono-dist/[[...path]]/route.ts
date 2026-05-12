import { pathToFileURL } from 'node:url';

type HonoApp = {
  fetch: (request: Request) => Promise<Response> | Response;
};

const moduleLoadedAt = Date.now();
const routePrefix = '/api/bench/hono-dist';
let appPromise: Promise<HonoApp> | undefined;

const toHonoRequest = (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname.slice(routePrefix.length);
  url.pathname = pathname || '/';

  return new Request(url, request);
};

const loadApp = () => {
  const appUrl = pathToFileURL(`${process.cwd()}/packages/hono-dist-bench/dist/index.mjs`);

  appPromise ||= import(
    /* webpackIgnore: true */
    /* turbopackIgnore: true */
    appUrl.href
  ).then((module) => (module as { default: HonoApp }).default);

  return appPromise;
};

const handle = async (request: Request) => {
  const startedAt = Date.now();
  const app = await loadApp();
  const response = await app.fetch(toHonoRequest(request));

  response.headers.set('x-bench-module-age-ms', String(startedAt - moduleLoadedAt));
  response.headers.set('x-bench-total-ms', String(Date.now() - startedAt));
  response.headers.set('x-bench-service', 'next-catchall-hono-dist-bench');

  return response;
};

export const GET = handle;
export const POST = handle;
