export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type HealthState = "healthy" | "degraded" | "error" | "unknown";

export interface Alert {
  id: string;
  timestamp: string;
  sourceIp: string;
  sourcePort?: number;
  destinationIp: string;
  destinationPort?: number;
  protocol?: string;
  probability?: number;
  risk?: RiskLevel;
  modelVersion?: string;
  status?: string;
}

export interface PredictionResult {
  prediction?: string;
  attack_probability?: number;
  risk_level?: RiskLevel;
  threshold?: number;
  model?: string;
  model_version?: string;
  feature_count?: number;
  alert_created?: boolean;
  [key: string]: unknown;
}

export interface HealthCheck {
  name: string;
  state: HealthState;
  detail?: string;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
}

export interface MetricPoint {
  label: string;
  value?: number;
  attacks?: number;
  benign?: number;
}

export interface DashboardMetrics {
  totalInferences?: number;
  attacksDetected?: number;
  benignTraffic?: number;
  criticalAlerts?: number;
  inferenceErrors?: number;
  window?: string;
  riskDistributionSource?: string;
  storedAlertsAnalyzed?: number;
  attackActivity?: MetricPoint[];
  trafficDistribution?: { name: string; value: number }[];
  riskDistribution?: { name: RiskLevel; value: number }[];
  alerts?: Alert[];
  health?: HealthCheck[];
}

export interface ModelInfo {
  name: string;
  version: string;
  threshold: number;
  featureCount: number;
  modelType: string;
  trainingStatus: string;
  productionStatus: string;
  accuracy: string;
  p95Latency: string;
  throughput: string;
  metrics: { label: string; value: string }[];
  features: { name: string; importance?: number }[];
}

export const MODEL_INFO: ModelInfo = {
  name: "HistGradientBoosting Top-30",
  version: "1.0.0",
  threshold: 0.49,
  featureCount: 30,
  modelType: "Histogram-based Gradient Boosting",
  trainingStatus: "Validated",
  productionStatus: "Production",
  accuracy: "0.972787",
  p95Latency: "≈ 6.07 ms",
  throughput: "≈ 224 flows/sec",
  metrics: [
    { label: "Precision", value: "0.980228" },
    { label: "Recall", value: "0.960737" },
    { label: "F1 score", value: "0.970385" },
    { label: "ROC-AUC", value: "0.995686" },
  ],
  features: [
    { name: "TCP_WIN_MAX_IN", importance: 100 },
    { name: "L4_DST_PORT", importance: 92 },
    { name: "L7_PROTO", importance: 86 },
    { name: "MAX_TTL", importance: 81 },
    { name: "L4_SRC_PORT", importance: 77 },
    { name: "DST_TO_SRC_SECOND_BYTES", importance: 72 },
    { name: "SRC_TO_DST_IAT_MIN", importance: 68 },
    { name: "CLIENT_TCP_FLAGS", importance: 64 },
    { name: "LONGEST_FLOW_PKT", importance: 60 },
    { name: "MIN_TTL", importance: 57 },
    { name: "NUM_PKTS_128_TO_256_BYTE", importance: 54 },
    { name: "DURATION_IN", importance: 51 },
    { name: "SRC_TO_DST_SECOND_BYTES", importance: 49 },
    { name: "TCP_WIN_MIN_IN", importance: 46 },
    { name: "NUM_PKTS_UP_TO_128_BYTE", importance: 44 },
    { name: "DURATION_OUT", importance: 41 },
    { name: "DST_TO_SRC_IAT_MIN", importance: 39 },
    { name: "NUM_PKTS_256_TO_512_BYTE", importance: 36 },
    { name: "RETRANSMITTED_IN_BYTES", importance: 34 },
    { name: "RETRANSMITTED_IN_PKTS", importance: 31 },
    { name: "TCP_FLAGS", importance: 29 },
    { name: "NUM_PKTS_512_TO_1024_BYTE", importance: 26 },
    { name: "SRC_TO_DST_AVG_THROUGHPUT", importance: 24 },
    { name: "DST_TO_SRC_AVG_THROUGHPUT", importance: 22 },
    { name: "ICMP_TYPE", importance: 19 },
    { name: "L4_PROTO", importance: 17 },
    { name: "NUM_PKTS_1024_TO_1514_BYTE", importance: 14 },
    { name: "TCP_WIN_MIN_OUT", importance: 12 },
    { name: "RETRANSMITTED_OUT_PKTS", importance: 9 },
    { name: "RETRANSMITTED_OUT_BYTES", importance: 7 },
  ],
};

export const FEATURE_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Traffic", keys: ["IN_BYTES", "OUT_BYTES", "IN_PKTS", "OUT_PKTS"] },
  {
    label: "TCP",
    keys: [
      "L4_SRC_PORT",
      "L4_DST_PORT",
      "TCP_FLAGS",
      "TCP_WIN_MAX_IN",
      "TCP_WIN_MIN_IN",
      "TCP_WIN_MIN_OUT",
      "CLIENT_TCP_FLAGS",
    ],
  },
  {
    label: "Timing",
    keys: [
      "DURATION_IN",
      "DURATION_OUT",
      "SRC_TO_DST_IAT_MIN",
      "DST_TO_SRC_IAT_MIN",
    ],
  },
  {
    label: "Throughput",
    keys: [
      "SRC_TO_DST_SECOND_BYTES",
      "DST_TO_SRC_SECOND_BYTES",
      "SRC_TO_DST_AVG_THROUGHPUT",
      "DST_TO_SRC_AVG_THROUGHPUT",
    ],
  },
  { label: "DNS & protocol", keys: ["L7_PROTO", "L4_PROTO", "ICMP_TYPE"] },
  {
    label: "Retransmission",
    keys: [
      "RETRANSMITTED_IN_BYTES",
      "RETRANSMITTED_IN_PKTS",
      "RETRANSMITTED_OUT_BYTES",
      "RETRANSMITTED_OUT_PKTS",
    ],
  },
  {
    label: "Packet statistics",
    keys: [
      "MAX_TTL",
      "MIN_TTL",
      "LONGEST_FLOW_PKT",
      "NUM_PKTS_UP_TO_128_BYTE",
      "NUM_PKTS_128_TO_256_BYTE",
      "NUM_PKTS_256_TO_512_BYTE",
    ],
  },
];
