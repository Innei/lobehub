import { createServer, type IncomingHttpHeaders, type IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 3011;
const port = Number(process.env.LOBE_DEV_TRPC_PORT || DEFAULT_PORT);
const host = process.env.LOBE_DEV_TRPC_HOST || 'localhost';

const toHeaders = (incomingHeaders: IncomingHttpHeaders) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(incomingHeaders)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
      continue;
    }

    headers.set(key, value);
  }

  return headers;
};

const hasRequestBody = (method: string) => method !== 'GET' && method !== 'HEAD';

const toWebRequest = (req: IncomingMessage) => {
  const method = req.method || 'GET';
  const requestHost = req.headers.host || `${host}:${port}`;
  const url = new URL(req.url || '/', `http://${requestHost}`);

  const init: RequestInit & { duplex?: 'half' } = {
    headers: toHeaders(req.headers),
    method,
  };

  if (hasRequestBody(method)) {
    init.body = req as unknown as BodyInit;
    init.duplex = 'half';
  }

  return new Request(url, init);
};

const main = async () => {
  const { createTrpcHonoApp } = await import('./app');
  const app = createTrpcHonoApp();

  const server = createServer((req, res) => {
    void (async () => {
      try {
        const response = await app.fetch(toWebRequest(req));

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        if (!response.body || req.method === 'HEAD') {
          res.end();
          return;
        }

        Readable.fromWeb(response.body).pipe(res);
      } catch (error) {
        console.error('tRPC Hono dev server error:', error);

        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
        }

        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    })();
  });

  server.listen(port, host, () => {
    console.info(`tRPC Hono dev server listening on http://${host}:${port}`);
  });
};

void main().catch((error) => {
  console.error('Failed to start tRPC Hono dev server:', error);
  process.exitCode = 1;
});
