const moduleLoadedAt = Date.now();

export const GET = async (request: Request) => {
  const startedAt = Date.now();
  const target = process.env.BENCH_FORWARD_TARGET;

  if (target) {
    const url = new URL(request.url);
    const upstreamUrl = new URL(url.pathname.replace('/api/bench/forward', '') || '/', target);
    upstreamUrl.search = url.search;

    const response = await fetch(upstreamUrl, {
      headers: {
        'x-bench-forwarded-by': 'lobe-next-forward-bench',
      },
    });

    return Response.json({
      moduleAgeMs: startedAt - moduleLoadedAt,
      status: response.status,
      target: upstreamUrl.toString(),
      totalMs: Date.now() - startedAt,
    });
  }

  return Response.json({
    moduleAgeMs: startedAt - moduleLoadedAt,
    ok: true,
    service: 'next-forward-bench',
    totalMs: Date.now() - startedAt,
  });
};
