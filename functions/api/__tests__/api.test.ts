import { describe, expect, it } from "vitest";
import { onRequestGet as eventsListGet } from "../configs/[config]/events";
import { onRequestGet as singleEventGet } from "../configs/[config]/events/[eventId]";
import { onRequestGet as configsGet } from "../configs/index";
import { onRequestGet as healthGet } from "../health";
import { onRequestGet as manifestGet } from "../manifest";

describe("Cloudflare Pages Functions API", () => {
  it("GET /api/health returns status ok", async () => {
    const res = await healthGet({ env: {} });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("particle-trace-api");
    expect(data.storage).toBe("local-fixtures");
  });

  it("GET /api/manifest returns dataset metadata", async () => {
    const req = new Request("http://localhost/api/manifest");
    const res = await manifestGet({ env: {}, request: req });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.dataset).toBe("CERN/ColliderML-Release-1");
    expect(data.configurations).toContain("ttbar_pu0");
  });

  it("GET /api/configs returns available channels", async () => {
    const res = await configsGet({ env: {} });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("ttbar_pu0");
  });

  it("GET /api/configs/:config/events returns paginated event list", async () => {
    const req = new Request(
      "http://localhost/api/configs/ttbar_pu0/events?limit=2&offset=0",
    );
    const res = await eventsListGet({
      env: {},
      params: { config: "ttbar_pu0" },
      request: req,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.configuration).toBe("ttbar_pu0");
    expect(data.events.length).toBeLessThanOrEqual(2);
  });

  it("GET /api/configs/:config/events prevents path traversal attacks", async () => {
    const req = new Request(
      "http://localhost/api/configs/../../etc/passwd/events",
    );
    const res = await eventsListGet({
      env: {},
      params: { config: "../../etc/passwd" },
      request: req,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid configuration");
  });

  it("GET /api/configs/:config/events/:eventId validates integer eventId", async () => {
    const res = await singleEventGet({
      env: {},
      params: { config: "ttbar_pu0", eventId: "not-an-id" },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid event ID");
  });

  it("GET /api/configs/:config/events/:eventId returns 404 for missing R2 object", async () => {
    const res = await singleEventGet({
      env: {},
      params: { config: "ttbar_pu0", eventId: "99999" },
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Event not found");
  });
});
