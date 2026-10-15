import { describe, expect, it } from "vitest";
import { geoFromCloudflareHeaders, isPublicIp } from "@/lib/ip-geo";

describe("isPublicIp", () => {
  it("rejects private ranges", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("10.0.0.1")).toBe(false);
    expect(isPublicIp("192.168.1.1")).toBe(false);
  });

  it("accepts public IPv4", () => {
    expect(isPublicIp("8.8.8.8")).toBe(true);
  });
});

describe("geoFromCloudflareHeaders", () => {
  it("parses Cloudflare geolocation headers", () => {
    const headers = new Headers({
      "CF-IPCountry": "KE",
      "CF-IPCity": "Nairobi",
      "CF-Region": "Nairobi County",
      "CF-Timezone": "Africa/Nairobi",
      "CF-IPLatitude": "-1.286389",
      "CF-IPLongitude": "36.817223",
      "CF-ASN": "33771",
      "CF-ASOrganization": "Safaricom Limited",
    });

    const geo = geoFromCloudflareHeaders(headers, "197.237.0.1");
    expect(geo?.source).toBe("cloudflare");
    expect(geo?.country).toBe("KE");
    expect(geo?.city).toBe("Nairobi");
    expect(geo?.asn).toBe(33771);
    expect(geo?.latitude).toBeCloseTo(-1.286389);
  });

  it("returns null when no geo headers present", () => {
    expect(geoFromCloudflareHeaders(new Headers(), "1.2.3.4")).toBeNull();
  });
});
