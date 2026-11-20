interface Env {
  R2_BUCKET?: {
    get: (key: string) => Promise<any>;
  };
}

export const onRequestGet = async (context: {
  env: Env;
  params: { config: string };
  request: Request;
}): Promise<Response> => {
  const { config } = context.params;

  // Strict regex to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(config)) {
    return new Response(
      JSON.stringify({ error: "Invalid configuration name" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const url = new URL(context.request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1),
    100,
  );
  const offset = Math.max(
    parseInt(url.searchParams.get("offset") || "0", 10),
    0,
  );

  // If R2 binding is active, attempt to fetch config manifest
  if (context.env && context.env.R2_BUCKET) {
    try {
      const manifestObj = await context.env.R2_BUCKET.get(
        `colliderml-release-1/${config}/manifest.json`,
      );
      if (manifestObj) {
        const text = await manifestObj.text();
        const data = JSON.parse(text);
        const paginated = (data.events || []).slice(offset, offset + limit);
        return new Response(
          JSON.stringify({
            configuration: config,
            totalEvents: (data.events || []).length,
            limit,
            offset,
            events: paginated,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          },
        );
      }
    } catch (e: any) {
      // Fallback
    }
  }

  // Fallback demo fixtures list
  const demoEvents = [
    {
      eventId: 0,
      particleCount: 13,
      trackerHitCount: 40,
      calorimeterCellCount: 14,
      trackCount: 4,
    },
    {
      eventId: 1,
      particleCount: 13,
      trackerHitCount: 40,
      calorimeterCellCount: 14,
      trackCount: 4,
    },
    {
      eventId: 2,
      particleCount: 13,
      trackerHitCount: 40,
      calorimeterCellCount: 14,
      trackCount: 4,
    },
  ];

  const paginated = demoEvents.slice(offset, offset + limit);
  return new Response(
    JSON.stringify({
      configuration: config,
      totalEvents: demoEvents.length,
      limit,
      offset,
      events: paginated,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
};
