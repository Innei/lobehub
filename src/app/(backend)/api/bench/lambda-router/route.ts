import { lambdaRouter } from '@/server/routers/lambda';

const moduleLoadedAt = Date.now();

export const GET = () => {
  const startedAt = Date.now();

  return Response.json({
    moduleAgeMs: startedAt - moduleLoadedAt,
    ok: true,
    procedures: Object.keys(lambdaRouter._def.procedures).length,
    service: 'lambda-router-import-bench',
    totalMs: Date.now() - startedAt,
  });
};
