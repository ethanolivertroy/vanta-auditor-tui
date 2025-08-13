import { Vanta } from "vanta-auditor-api-sdk";
import { Headers } from "undici";

export type Region = "us" | "eu" | "aus" | "custom";

export interface VantaOptions {
  token?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  region: Region;
  serverURL?: string;
  debug?: boolean;
}

export async function createVantaClient(options: VantaOptions): Promise<Vanta> {
  const { token, clientId, clientSecret, scope, region, serverURL, debug } = options;
  
  // Validate that we have some form of authentication
  if (!token && (!clientId || !clientSecret)) {
    throw new Error("Authentication required: Please provide either a bearer token or OAuth client credentials (clientId + clientSecret)");
  }
  
  let bearer = token;
  if (!bearer && clientId && clientSecret) {
    // Exchanging OAuth credentials
    // exchange via OAuth client credentials
    const base = serverURL ? new URL(serverURL).origin : regionToOrigin(region);
    const tokenUrl = `${base}/oauth/token`;
    const desiredScope = scope ?? "auditor-api.audit:read auditor-api.auditor:read";
    try {
      bearer = await getCachedToken({ tokenUrl, clientId, clientSecret, scope: desiredScope, base });
      // Access token obtained
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OAuth authentication failed: ${message}`);
    }
  }
  if (!bearer) {
    throw new Error("Failed to obtain authentication token");
  }
  
  const sdk = new Vanta({
    bearerAuth: bearer,
    serverIdx: serverURL ? undefined : regionToIndex(region),
    serverURL: serverURL,
    retryConfig: {
      strategy: "backoff",
      backoff: {
        initialInterval: 1,
        maxInterval: 30,
        exponent: 1.3,
        maxElapsedTime: 120
      },
      retryConnectionErrors: true
    },
    debugLogger: debug ? console : undefined
  });
  
  // Validate the client by attempting a simple API call
  try {
    // Validating API access
    // Test the connection with a simple list call with minimal results
    await sdk.audits.list({ pageSize: 1 });
    // API access validated
  } catch (error) {
    // API validation failed - will throw with details
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("401") || message.includes("Unauthorized")) {
      throw new Error("Authentication failed: Invalid token or credentials. Please check your Vanta API settings.");
    } else if (message.includes("403") || message.includes("Forbidden")) {
      throw new Error("Authorization failed: Your credentials don't have permission to access the Auditor API. Please check your scope settings.");
    } else if (message.includes("404")) {
      throw new Error(`API endpoint not found: Please check your region setting (current: ${region}) or server URL.`);
    } else {
      throw new Error(`Failed to connect to Vanta API: ${message}`);
    }
  }

  return sdk;
}

function regionToIndex(region: Region): number | undefined {
  switch (region) {
    case "us":
      return 0;
    case "eu":
      return 1;
    case "aus":
      return 2;
    default:
      return undefined;
  }
}

function regionToOrigin(region: Region): string {
  switch (region) {
    case "us":
      return "https://api.vanta.com";
    case "eu":
      return "https://api.eu.vanta.com";
    case "aus":
      return "https://api.aus.vanta.com";
    default:
      return "https://api.vanta.com";
  }
}

type TokenInput = {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  base: string;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const tokenPromiseCache = new Map<string, Promise<string>>();

async function getCachedToken(inp: TokenInput): Promise<string> {
  const key = `${inp.base}|${inp.clientId}|${inp.scope}`;
  const now = Date.now();
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.token;
  }
  const pending = tokenPromiseCache.get(key);
  if (pending) return pending;

  const p = fetchTokenWithRetry(inp).then((res) => {
    tokenCache.set(key, { token: res.token, expiresAt: res.expiresAt });
    tokenPromiseCache.delete(key);
    return res.token;
  }).catch((e) => {
    tokenPromiseCache.delete(key);
    throw e;
  });
  tokenPromiseCache.set(key, p);
  return p;
}

async function fetchTokenWithRetry(inp: TokenInput): Promise<{ token: string; expiresAt: number }> {
  let attempt = 0;
  let lastErr: unknown = undefined;
  while (attempt < 4) {
    attempt += 1;
    try {
      const res = await fetch(inp.tokenUrl, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          client_id: inp.clientId,
          client_secret: inp.clientSecret,
          scope: inp.scope,
          grant_type: "client_credentials"
        })
      });
      if (res.ok) {
        const data = (await res.json()) as { access_token: string; expires_in?: number };
        const ttlSec = typeof data.expires_in === "number" ? data.expires_in : 3600;
        return { token: data.access_token, expiresAt: Date.now() + (ttlSec - 60) * 1000 };
      }
      const retryAfter = Number(res.headers.get("retry-after")) || 0;
      const text = await res.text().catch(() => "");
      const detail = (() => {
        try {
          const j = JSON.parse(text);
          return j.error_description || j.error || text;
        } catch {
          return text;
        }
      })();
      // Retry on 429/5xx
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const backoff = retryAfter * 1000 || Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw new Error(`OAuth token request failed: ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""} (host: ${inp.base})`);
    } catch (e) {
      lastErr = e;
      // small jitter before retry
      await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 8000)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

