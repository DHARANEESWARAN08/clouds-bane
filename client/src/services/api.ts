import type {
  Alert,
  DashboardMetrics,
  HealthCheck,
  HealthState,
  PredictionResult,
} from "@/types";

export interface DatasetDistributionItem {
  name: string;
  value: number;
}

export interface DatasetFlowMonth {
  label: string;
  value: number;
}

export interface DatasetRelationship {
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  flows: number;
}

export interface DatasetAnalytics {
  schemaVersion: number;
  source: string;
  dataset: string;
  generatedAt: string;
  totalRows: number;
  processedRows: number;
  protocolDistribution: DatasetDistributionItem[];
  labelDistribution: DatasetDistributionItem[];
  flowVolumeByMonth: DatasetFlowMonth[];
  topRelationships: DatasetRelationship[];
  relationshipNote?: string;
}

const CONFIGURED_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");
// Vite proxies this path only during local development, avoiding a browser CORS
// preflight while preserving the deployed API URL in production builds.
const API_BASE_URL =
  import.meta.env.DEV && CONFIGURED_API_BASE_URL
    ? "/api"
    : CONFIGURED_API_BASE_URL;
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "Live data connection pending. Set VITE_API_BASE_URL to connect Cloud’s Bane to the AWS API."
    );
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

type AlertResponse = Record<string, unknown>[] | { alerts?: unknown };

export function normalizeAlertsResponse(
  response: AlertResponse | null
): Alert[] {
  const rows = Array.isArray(response)
    ? response
    : response && typeof response === "object" && Array.isArray(response.alerts)
      ? response.alerts
      : null;

  if (
    !rows ||
    rows.some(item => !item || typeof item !== "object" || Array.isArray(item))
  ) {
    throw new Error("Alerts endpoint returned an invalid response.");
  }

  const optionalText = (value: unknown) =>
    value == null || value === "" ? undefined : String(value);
  const optionalNumber = (value: unknown) => {
    if (value == null || value === "") return undefined;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  return (rows as Record<string, unknown>[]).map(item => ({
    id: optionalText(item.alert_id ?? item.id) ?? "Unavailable",
    timestamp: optionalText(item.timestamp) ?? "",
    sourceIp: optionalText(item.ipv4_src_addr ?? item.sourceIp) ?? "",
    sourcePort: optionalNumber(item.l4_src_port ?? item.sourcePort),
    destinationIp: optionalText(item.ipv4_dst_addr ?? item.destinationIp) ?? "",
    destinationPort: optionalNumber(item.l4_dst_port ?? item.destinationPort),
    protocol: optionalText(item.protocol),
    probability: optionalNumber(item.attack_probability ?? item.probability),
    risk: (item.risk_level ?? item.risk) as Alert["risk"],
    modelVersion: optionalText(item.model_version),
    status: optionalText(item.status),
  }));
}

export const api = {
  get demoMode() {
    return false;
  },
  get baseUrl() {
    return CONFIGURED_API_BASE_URL;
  },
  async predict(
    features: Record<string, number | string>
  ): Promise<PredictionResult> {
    return request<PredictionResult>("/predict", {
      method: "POST",
      body: JSON.stringify(features),
    });
  },
  async getAlerts(): Promise<Alert[]> {
    const response = await request<AlertResponse | null>("/alerts");
    return normalizeAlertsResponse(response);
  },
  async getMetrics(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>("/metrics");
  },
  async getDatasetAnalytics(): Promise<DatasetAnalytics> {
    return request<DatasetAnalytics>("/dataset-analytics");
  },
  async getHealth(): Promise<HealthCheck[]> {
    type HealthResponse =
      | {
          status?: string;
          service?: string;
          checks?: Record<string, string>;
          health?: HealthCheck[];
        }
      | HealthCheck[];

    const response = await request<HealthResponse>("/health");

    // Support an array response if the API format changes later.
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.health)) {
      return response.health;
    }

    const checks = response.checks ?? {};
    const toState = (val?: string): HealthState => {
      if (!val) return "unknown";
      const s = val.toLowerCase();
      if (
        ["healthy", "ok", "active", "reachable", "ready", "available"].includes(
          s
        )
      )
        return "healthy";
      if (["degraded", "warning", "partial"].includes(s)) return "degraded";
      if (
        ["error", "unhealthy", "failed", "inactive", "unreachable"].includes(s)
      )
        return "error";
      return "unknown";
    };

    const apiGatewayState = toState(response.status);
    const checkState = (name: string) => toState(checks[name]);

    const healthChecks: HealthCheck[] = [
      {
        name: "API Gateway",
        state: apiGatewayState,
        detail: response.status
          ? `Health endpoint status: ${response.status}`
          : "Status not reported",
      },
      {
        name: "Lambda",
        state: checkState("lambda"),
        detail: checks.lambda
          ? `Health check: ${checks.lambda}`
          : "Not reported by health endpoint",
      },
      {
        name: "ML Engine",
        state: "unknown",
        detail: "Not reported by health endpoint",
      },
      {
        name: "DynamoDB",
        state: checkState("dynamodb"),
        detail: checks.dynamodb
          ? `Health check: ${checks.dynamodb}`
          : "Not reported by health endpoint",
      },
      {
        name: "CloudWatch",
        state: checkState("cloudwatch"),
        detail: checks.cloudwatch
          ? `Health check: ${checks.cloudwatch}`
          : "Not reported by health endpoint",
      },
    ];

    return healthChecks;
  },
};
