import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { createLambdaContext } from '@/libs/trpc/lambda/context';
import { prepareRequestForTRPC } from '@/libs/trpc/utils/request-adapter';
import { createResponseMeta } from '@/libs/trpc/utils/responseMeta';
import { lambdaRouter } from '@/server/routers/lambda';

const ENDPOINT = '/trpc/lambda';

const allowedHeaders = [
  'authorization',
  'content-type',
  'lobe-auth-dev-backend-api',
  'oidc-auth',
  'traceparent',
  'tracestate',
  'x-api-key',
  'x-lobe-chat-auth',
];

const createTrpcHandler = (request: Request) =>
  fetchRequestHandler({
    createContext: () => createLambdaContext(request),
    endpoint: ENDPOINT,
    onError: ({ error, path, type }) => {
      if (error.code === 'UNAUTHORIZED') return;

      console.info(`Error in tRPC Hono handler on path: ${path}, type: ${type}`);
      console.error(error);
    },
    req: prepareRequestForTRPC(request),
    responseMeta: createResponseMeta,
    router: lambdaRouter,
  });

export const createTrpcHonoApp = () => {
  const app = new Hono();

  app.use(
    '/trpc/*',
    cors({
      allowHeaders: allowedHeaders,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      origin: (origin) => origin || '*',
    }),
  );

  app.get('/healthz', (c) =>
    c.json({
      endpoint: ENDPOINT,
      ok: true,
      service: 'lobe-trpc-hono',
    }),
  );

  app.all(`${ENDPOINT}/*`, (c) => createTrpcHandler(c.req.raw));
  app.all(ENDPOINT, (c) => createTrpcHandler(c.req.raw));

  return app;
};
