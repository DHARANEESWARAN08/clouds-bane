import { describe, expect, it } from "vitest";
import { normalizeAlertsResponse } from "./api";

describe("Cloud’s Bane API configuration", () => {
  it("reaches the configured health endpoint without frontend credentials", async () => {
    const baseUrl = process.env.VITE_API_BASE_URL;
    expect(
      baseUrl,
      "VITE_API_BASE_URL must be configured for this connectivity test"
    ).toBeTruthy();
    const response = await fetch(`${baseUrl!.replace(/\/$/, "")}/health`);
    expect(response.status).toBeLessThan(500);
  }, 15000);
});

describe("alerts response normalization", () => {
  it("maps the deployed { count, alerts } response without inventing missing endpoints", () => {
    const alerts = normalizeAlertsResponse({
      count: 1,
      alerts: [
        {
          alert_id: "alert-1",
          l4_src_port: 54706,
          l4_dst_port: 80,
          attack_probability: 0.999766,
          risk_level: "CRITICAL",
        },
      ],
    });

    expect(alerts[0]).toMatchObject({
      id: "alert-1",
      sourceIp: "",
      sourcePort: 54706,
      destinationIp: "",
      destinationPort: 80,
      probability: 0.999766,
      risk: "CRITICAL",
    });
  });

  it("rejects null or malformed successful responses instead of treating them as empty alerts", () => {
    expect(() => normalizeAlertsResponse(null)).toThrow("invalid response");
    expect(() => normalizeAlertsResponse({ alerts: null })).toThrow(
      "invalid response"
    );
  });

  it("accepts a genuine empty alerts array", () => {
    expect(normalizeAlertsResponse({ count: 0, alerts: [] })).toEqual([]);
  });
});
