interface Env {
  R2_BUCKET?: {
    get: (key: string) => Promise<any>;
  };
}

export const onRequestGet = async (context: {
  env: Env;
  request: Request;
}): Promise<Response> => {
  const { env } = context;

  if (env && env.R2_BUCKET) {
    try {
      const obj = await env.R2_BUCKET.get("colliderml-release-1/manifest.json");
      if (obj) {
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    } catch (e: any) {
      // Fallback
    }
  }

  // Default manifest
  const fallbackManifest = {
    dataset: "CERN/ColliderML-Release-1",
    release: "Release 1",
    description:
      "Simulated high-energy physics collision events across truth particles, tracker measurements, calorimeter cells, and reconstructed tracks.",
    citation:
      "CERN ColliderML Collaboration (2024). ColliderML Release 1. Hugging Face.",
    license: "CC-BY-4.0",
    configurations: ["ttbar_pu0"],
    totalEvents: 3,
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(fallbackManifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
