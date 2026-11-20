interface Env {
  R2_BUCKET?: {
    get: (key: string) => Promise<any>;
  };
}

export const onRequestGet = async (context: {
  env: Env;
}): Promise<Response> => {
  const configs = [
    {
      id: "ttbar_pu0",
      channel: "ttbar",
      pileup: "pu0",
      description: "Top-quark pair production with zero pileup interactions",
      subsystems: [
        "Pixel",
        "ShortStrip",
        "LongStrip",
        "ECalBarrel",
        "HCalBarrel",
      ],
    },
  ];

  return new Response(JSON.stringify(configs, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=600",
    },
  });
};
