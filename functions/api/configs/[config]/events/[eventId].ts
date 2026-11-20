interface Env {
  R2_BUCKET?: {
    get: (key: string) => Promise<any>;
  };
}

export const onRequestGet = async (context: {
  env: Env;
  params: { config: string; eventId: string };
}): Promise<Response> => {
  const { config, eventId } = context.params;

  // Strict parameter validation
  if (!/^[a-zA-Z0-9_-]+$/.test(config)) {
    return new Response(
      JSON.stringify({ error: "Invalid configuration name" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!/^\d+$/.test(eventId)) {
    return new Response(
      JSON.stringify({ error: "Invalid event ID. Must be integer." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Attempt R2 retrieval
  if (context.env && context.env.R2_BUCKET) {
    try {
      // Check uncompressed then compressed
      const key = `colliderml-release-1/${config}/events/${eventId}.json`;
      let obj = await context.env.R2_BUCKET.get(key);
      if (obj) {
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, immutable",
          },
        });
      }

      const gzKey = `colliderml-release-1/${config}/events/${eventId}.json.gz`;
      obj = await context.env.R2_BUCKET.get(gzKey);
      if (obj) {
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
            "Cache-Control": "public, max-age=3600, immutable",
          },
        });
      }
    } catch (e: any) {
      // Fall through to 404
    }
  }

  return new Response(
    JSON.stringify({
      error: "Event not found",
      configuration: config,
      eventId,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
};
