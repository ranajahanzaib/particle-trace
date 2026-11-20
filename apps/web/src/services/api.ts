import { ConfigManifest, DatasetManifest, EventBundle } from "@/types";

export interface DataService {
  getDatasetManifest(): Promise<DatasetManifest>;
  getConfigurations(): Promise<
    { id: string; channel: string; pileup: string; description: string }[]
  >;
  getConfigManifest(config: string): Promise<ConfigManifest>;
  getEventBundle(config: string, eventId: number): Promise<EventBundle>;
}

class ApiDataRepository implements DataService {
  private cache: Map<string, any> = new Map();

  async getDatasetManifest(): Promise<DatasetManifest> {
    const cacheKey = "dataset-manifest";
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const res = await fetch("/api/manifest");
      if (res.ok) {
        const data = await res.json();
        this.cache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Fallback to local static asset
    }

    const fallbackRes = await fetch("/data/manifest.json");
    if (!fallbackRes.ok) {
      throw new Error("Failed to load dataset manifest");
    }
    const data = await fallbackRes.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  async getConfigurations(): Promise<
    { id: string; channel: string; pileup: string; description: string }[]
  > {
    try {
      const res = await fetch("/api/configs");
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return [
      {
        id: "ttbar_pu0",
        channel: "ttbar",
        pileup: "pu0",
        description: "Top-quark pair production with zero pileup interactions",
      },
    ];
  }

  async getConfigManifest(config: string): Promise<ConfigManifest> {
    const cacheKey = `config-manifest-${config}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const res = await fetch(`/api/configs/${config}/events?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const manifest: ConfigManifest = {
          configuration: config,
          channel: config.split("_")[0] || "ttbar",
          pileup: config.split("_")[1] || "pu0",
          eventCount: data.totalEvents || data.events.length,
          events: data.events,
          updatedAt: new Date().toISOString(),
        };
        this.cache.set(cacheKey, manifest);
        return manifest;
      }
    } catch {
      // Fallback
    }

    const fallbackRes = await fetch(`/data/${config}/manifest.json`);
    if (!fallbackRes.ok) {
      throw new Error(`Failed to load manifest for configuration ${config}`);
    }
    const data = await fallbackRes.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  async getEventBundle(config: string, eventId: number): Promise<EventBundle> {
    const cacheKey = `event-${config}-${eventId}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const res = await fetch(`/api/configs/${config}/events/${eventId}`);
      if (res.ok) {
        const bundle = await res.json();
        this.cache.set(cacheKey, bundle);
        return bundle;
      }
    } catch {
      // Fallback to static fixtures
    }

    const fallbackRes = await fetch(`/data/${config}/events/${eventId}.json`);
    if (!fallbackRes.ok) {
      throw new Error(`Event ${eventId} not found for configuration ${config}`);
    }
    const bundle = await fallbackRes.json();
    this.cache.set(cacheKey, bundle);
    return bundle;
  }
}

export const dataRepository = new ApiDataRepository();
