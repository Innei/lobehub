declare const app: {
  fetch: (request: Request) => Promise<Response> | Response;
};

export { app };
export default app;
