interface Env {
  R2_BUCKET?: {
    get: (key: string) => Promise<any>;
    list: (options?: any) => Promise<any>;
  };
}

export const onRequestGet = async (context: {
  env: Env;
}): Promise<Response> => {
  const hasR2 = Boolean(context.env && context.env.R2_BUCKET);
  const healthData = {
    status: "ok",
    service: "particle-trace-api",
    version: "1.0.0",
    storage: hasR2 ? "cloudflare-r2" : "local-fixtures",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
};
