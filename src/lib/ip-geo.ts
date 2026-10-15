export type PaymentAuditIpGeo = {
  source: "cloudflare" | "ipwhois" | "none";
  ip: string | null;
  country: string | null;
  countryName: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  continent: string | null;
  timezone: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  metroCode: string | null;
  asn: number | null;
  asOrganization: string | null;
  isp: string | null;
  isProxy: boolean | null;
  isHosting: boolean | null;
  isMobile: boolean | null;
};

const CF_HEADER_MAP: { field: keyof PaymentAuditIpGeo; names: string[] }[] = [
  { field: "country", names: ["cf-ipcountry", "CF-IPCountry"] },
  { field: "city", names: ["cf-ipcity", "CF-IPCity"] },
  { field: "continent", names: ["cf-ipcontinent", "CF-IPContinent"] },
  { field: "region", names: ["cf-region", "CF-Region"] },
  { field: "regionCode", names: ["cf-region-code", "CF-Region-Code"] },
  { field: "timezone", names: ["cf-timezone", "CF-Timezone"] },
  { field: "postalCode", names: ["cf-postal-code", "CF-Postal-Code"] },
  { field: "metroCode", names: ["cf-metro-code", "CF-Metro-Code"] },
];

function readHeader(headers: Headers, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIntOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function isPublicIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return false;
  if (normalized === "::1" || normalized.startsWith("fe80:")) return false;
  if (normalized.includes(":")) {
    return !normalized.startsWith("fc") && !normalized.startsWith("fd");
  }
  const parts = normalized.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  return true;
}

export function geoFromCloudflareHeaders(
  headers: Headers,
  ip: string | null,
): PaymentAuditIpGeo | null {
  const geo: PaymentAuditIpGeo = {
    source: "cloudflare",
    ip,
    country: null,
    countryName: null,
    region: null,
    regionCode: null,
    city: null,
    continent: null,
    timezone: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    metroCode: null,
    asn: parseIntOrNull(readHeader(headers, ["cf-asn", "CF-ASN"])),
    asOrganization: readHeader(headers, ["cf-asorganization", "CF-ASOrganization"]),
    isp: null,
    isProxy: null,
    isHosting: null,
    isMobile: null,
  };

  for (const { field, names } of CF_HEADER_MAP) {
    const value = readHeader(headers, names);
    if (value) {
      (geo as Record<string, string | null>)[field] = value;
    }
  }

  geo.latitude = parseCoord(
    readHeader(headers, ["cf-iplatitude", "CF-IPLatitude", "cf-latitude"]),
  );
  geo.longitude = parseCoord(
    readHeader(headers, ["cf-iplongitude", "CF-IPLongitude", "cf-longitude"]),
  );

  const hasSignal =
    geo.country ||
    geo.city ||
    geo.region ||
    geo.asn ||
    geo.latitude != null ||
    geo.longitude != null;

  if (!hasSignal) return null;
  return geo;
}

type IpWhoisResponse = {
  success?: boolean;
  ip?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  continent?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
  };
  security?: {
    proxy?: boolean;
    hosting?: boolean;
    mobile?: boolean;
  };
};

export async function lookupIpGeoApi(ip: string): Promise<PaymentAuditIpGeo> {
  const empty: PaymentAuditIpGeo = {
    source: "none",
    ip,
    country: null,
    countryName: null,
    region: null,
    regionCode: null,
    city: null,
    continent: null,
    timezone: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    metroCode: null,
    asn: null,
    asOrganization: null,
    isp: null,
    isProxy: null,
    isHosting: null,
    isMobile: null,
  };

  if (!isPublicIp(ip)) return empty;

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return empty;
    const data = (await res.json()) as IpWhoisResponse;
    if (!data.success) return empty;

    return {
      source: "ipwhois",
      ip: data.ip ?? ip,
      country: data.country_code ?? null,
      countryName: data.country ?? null,
      region: data.region ?? null,
      regionCode: null,
      city: data.city ?? null,
      continent: data.continent ?? null,
      timezone: data.timezone?.id ?? null,
      postalCode: data.postal ?? null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      metroCode: null,
      asn: data.connection?.asn ?? null,
      asOrganization: data.connection?.org ?? null,
      isp: data.connection?.isp ?? null,
      isProxy: data.security?.proxy ?? null,
      isHosting: data.security?.hosting ?? null,
      isMobile: data.security?.mobile ?? null,
    };
  } catch {
    return empty;
  }
}

export async function resolveIpGeo(
  headers: Headers,
  ip: string | null,
): Promise<PaymentAuditIpGeo | null> {
  if (!ip) return null;

  const fromCf = geoFromCloudflareHeaders(headers, ip);
  if (fromCf) return fromCf;

  if (!isPublicIp(ip)) return null;

  const fromApi = await lookupIpGeoApi(ip);
  if (fromApi.source !== "none") return fromApi;
  return null;
}

export function formatIpGeoSummary(geo: PaymentAuditIpGeo | null | undefined): string | null {
  if (!geo) return null;
  const parts: string[] = [];
  if (geo.city) parts.push(geo.city);
  if (geo.region) parts.push(geo.region);
  else if (geo.regionCode) parts.push(geo.regionCode);
  if (geo.countryName) parts.push(geo.countryName);
  else if (geo.country) parts.push(geo.country);
  if (parts.length === 0 && geo.isp) parts.push(geo.isp);
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatBoolFlag(value: boolean | null): string {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}

/** Flat key/value rows for admin detail UI (omits empty values). */
export function ipGeoDetailRows(
  geo: PaymentAuditIpGeo | null | undefined,
): { label: string; value: string }[] {
  if (!geo) return [];

  const rows: { label: string; value: string }[] = [
    { label: "Lookup source", value: geo.source },
  ];

  const push = (label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return;
    rows.push({ label, value: String(value) });
  };

  push("Country code", geo.country);
  push("Country", geo.countryName);
  push("Region", geo.region);
  push("Region code", geo.regionCode);
  push("City", geo.city);
  push("Continent", geo.continent);
  push("Postal code", geo.postalCode);
  push("Timezone", geo.timezone);
  push("Metro code", geo.metroCode);

  if (geo.latitude != null && geo.longitude != null) {
    rows.push({
      label: "Coordinates",
      value: `${geo.latitude}, ${geo.longitude}`,
    });
  }

  push("ASN", geo.asn);
  push("AS organization", geo.asOrganization);
  push("ISP", geo.isp);

  if (geo.isProxy !== null) {
    rows.push({ label: "Proxy / VPN", value: formatBoolFlag(geo.isProxy) });
  }
  if (geo.isHosting !== null) {
    rows.push({ label: "Hosting / DC", value: formatBoolFlag(geo.isHosting) });
  }
  if (geo.isMobile !== null) {
    rows.push({ label: "Mobile network", value: formatBoolFlag(geo.isMobile) });
  }

  return rows;
}

/** Searchable text for admin filters. */
export function ipGeoSearchText(geo: PaymentAuditIpGeo | null | undefined): string {
  if (!geo) return "";
  return [
    geo.country,
    geo.countryName,
    geo.region,
    geo.regionCode,
    geo.city,
    geo.continent,
    geo.timezone,
    geo.postalCode,
    geo.metroCode,
    geo.isp,
    geo.asOrganization,
    geo.asn != null ? `AS${geo.asn}` : null,
    geo.source,
  ]
    .filter(Boolean)
    .join(" ");
}
