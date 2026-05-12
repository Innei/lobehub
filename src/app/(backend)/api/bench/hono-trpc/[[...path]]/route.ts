import { createTrpcHonoApp } from '@/server/trpc-hono/app';

const moduleLoadedAt = Date.now();
const app = createTrpcHonoApp();

const toHonoRequest = (request: Request, pathname = '/healthz') => {
  const url = new URL(request.url);
  url.pathname = pathname;

  return new Request(url, request);
};

export const GET = async (request: Request) => {
  const startedAt = Date.now();
  const response = await app.fetch(toHonoRequest(request));
  const data = await response.json();

  return Response.json({
    data,
    moduleAgeMs: startedAt - moduleLoadedAt,
    service: 'next-wrapped-hono-trpc-bench',
    totalMs: Date.now() - startedAt,
  });
};

export const POST = async (request: Request) => app.fetch(request);
